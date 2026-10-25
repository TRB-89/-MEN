"""Unit and integration tests for GitHub Threat Intelligence Integration (MITRE ATT&CK & CISA KEV)."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.threat_intel.service import threat_intel_service

client = TestClient(app)


def setup_module():
    """Ensure threat intel service is initialized with local cache."""
    threat_intel_service.initialize(auto_fetch=False)


def test_threat_intel_summary():
    """Verify threat intelligence summary returns cached counts and attribution."""
    response = client.get("/api/v1/threat-intel/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["offline_ready"] is True
    assert data["mitre_attack"]["total_techniques"] >= 700
    assert data["cisa_kev"]["total_vulnerabilities"] >= 1700
    assert "attribution" in data
    assert "mitre_attack" in data["attribution"]
    assert "cisa_kev" in data["attribution"]


def test_threat_intel_attribution():
    """Verify attribution endpoint returns licensing terms and copyright notices."""
    response = client.get("/api/v1/threat-intel/attribution")
    assert response.status_code == 200
    data = response.json()
    assert "attribution" in data
    assert "disclaimer" in data
    assert "Apache" in data["attribution"]["mitre_attack"]["license"]
    assert "CC0" in data["attribution"]["cisa_kev"]["license"]


def test_search_mitre_techniques():
    """Verify searching MITRE ATT&CK techniques by keyword, tactic, and ID."""
    # 1. Search by technique ID
    res = client.get("/api/v1/threat-intel/mitre?q=T1190")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert any(t["id"] == "T1190" for t in data["results"])
    t1190 = next(t for t in data["results"] if t["id"] == "T1190")
    assert "Exploit Public-Facing Application" in t1190["name"]
    assert "attack.mitre.org" in t1190["url"]

    # 2. Filter by tactic
    res_tactic = client.get("/api/v1/threat-intel/mitre?tactic=lateral-movement&limit=10")
    assert res_tactic.status_code == 200
    data_tactic = res_tactic.json()
    assert data_tactic["count"] <= 10
    assert all("lateral-movement" in [tac.lower() for tac in t["tactics"]] for t in data_tactic["results"])


def test_get_mitre_technique_by_id():
    """Verify direct lookup of individual MITRE techniques."""
    res = client.get("/api/v1/threat-intel/mitre/T1021.004")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "T1021.004"
    assert "SSH" in data["name"] or "Remote Services" in data["name"]
    assert "https://attack.mitre.org" in data["url"]

    # Non-existent ID returns 404
    res_404 = client.get("/api/v1/threat-intel/mitre/T9999.999")
    assert res_404.status_code == 404


def test_search_cisa_kev():
    """Verify searching CISA KEV catalog by keyword, vendor, and ransomware flag."""
    # 1. Search by vendor
    res = client.get("/api/v1/threat-intel/cisa-kev?vendor=Citrix&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert all("citrix" in v["vendorProject"].lower() for v in data["results"])

    # 2. Search ransomware-associated vulnerabilities
    res_rw = client.get("/api/v1/threat-intel/cisa-kev?ransomware_only=true&limit=10")
    assert res_rw.status_code == 200
    data_rw = res_rw.json()
    assert data_rw["total"] >= 1
    assert all((v["knownRansomwareCampaignUse"] or "").lower() == "known" for v in data_rw["results"])


def test_get_cisa_kev_cve():
    """Verify direct lookup of individual CISA KEV entry and remediation actions."""
    res = client.get("/api/v1/threat-intel/cisa-kev/CVE-2023-3519")
    assert res.status_code == 200
    data = res.json()
    assert data["cveID"] == "CVE-2023-3519"
    assert "Citrix" in data["vendorProject"]
    assert "requiredAction" in data
    assert len(data["requiredAction"]) > 10

    # Non-existent CVE returns 404
    res_404 = client.get("/api/v1/threat-intel/cisa-kev/CVE-1900-99999")
    assert res_404.status_code == 404


def test_asset_vulnerability_enrichment():
    """Verify evidence-based asset vulnerability correlation against CISA KEV.
    
    gw-ext-01 explicitly declares CVE-2023-3519 in synthetic enterprise topology.
    Must correlate without hallucinating non-existent vulnerabilities.
    """
    res = client.get("/api/v1/threat-intel/assets/gw-ext-01/vulnerabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["asset_id"] == "gw-ext-01"
    assert data["cisa_kev_matches_count"] >= 1
    match = next(m for m in data["matches"] if m["cve_id"] == "CVE-2023-3519")
    assert match["matched_by"] == "EXPLICIT_CVE_EVIDENCE"
    assert match["in_cisa_kev"] is True
    assert "Citrix" in match["vendor_project"]
    assert "required_action" in match

    # Asset with no CVEs returns 0 matches
    res_clean = client.get("/api/v1/threat-intel/assets/fw-dmz-01/vulnerabilities")
    assert res_clean.status_code == 200
    assert res_clean.json()["vulnerabilities_count"] == 0
    assert res_clean.json()["cisa_kev_matches_count"] == 0


def test_module3_attack_path_threat_intel_enrichment():
    """Verify Module 3 attack path prediction incorporates official MITRE techniques and CISA KEV."""
    payload = {
        "source_asset_id": "srv-web-01",
        "target_asset_id": "db-prod-01",
        "max_depth": 5,
        "top_k": 3,
    }
    res = client.post("/api/v1/attack-paths/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["candidate_paths"]) >= 1

    first_path = data["candidate_paths"][0]
    assert len(first_path["hop_details"]) >= 1

    # Check that hops have mitre technique ID and explanation
    for hop in first_path["hop_details"]:
        assert hop["mitre_technique_id"].startswith("T")
        assert len(hop["mitre_technique_name"]) > 0
        if hop.get("mitre_url"):
            assert "attack.mitre.org" in hop["mitre_url"]
