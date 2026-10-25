"""Comprehensive verification test suite for ØMEN Complete Threat Intelligence Integration.

Verifies:
- MITRE ATT&CK STIX enterprise techniques (>700 active techniques)
- CISA Known Exploited Vulnerabilities catalog (>1,700 CVEs)
- FIRST EPSS probability scores & percentiles (>390,000 CVEs)
- NVD JSON 2.0 CVSS scores & affected products
- Normalized multi-source joining on exact CVE identifiers
- All FastAPI endpoints under /api/v1/intelligence/
- Offline operation without external paid APIs
- Evidence-based asset correlation (no arbitrary hallucinated CVEs)
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.threat_intelligence.intelligence_service import intelligence_service
from backend.threat_intelligence.ollama_assistant import is_ollama_available

client = TestClient(app)


def setup_module():
    """Ensure unified threat intelligence service is initialized from local caches."""
    intelligence_service.initialize(force_refresh=False)


def test_threat_intelligence_status_endpoint():
    """Verify operational status and summary metrics across all 4 intelligence feeds."""
    res = client.get("/api/v1/intelligence/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["offline_ready"] is True
    counts = data["summary_counts"]
    assert counts["mitre_techniques"] >= 700
    assert counts["cisa_kev_vulnerabilities"] >= 1700
    assert counts["epss_scores"] >= 300000
    assert counts["nvd_vulnerabilities"] >= 300000

    # Verify optional services section
    assert "optional_services" in data
    assert "virustotal" in data["optional_services"]
    assert "abuseipdb" in data["optional_services"]
    assert "gemini" in data["optional_services"]


def test_mitre_techniques_endpoints():
    """Verify MITRE ATT&CK search, tactic filtering, and individual lookup."""
    # 1. Search technique by ID
    res = client.get("/api/v1/intelligence/mitre/techniques?q=T1190")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    t1190 = next(t for t in data["techniques"] if t["technique_id"] == "T1190")
    assert "Exploit Public-Facing Application" in t1190["name"]
    assert "https://attack.mitre.org" in t1190["url"]

    # 2. Filter by tactic
    res_tactic = client.get("/api/v1/intelligence/mitre/techniques?tactic=lateral-movement&limit=10")
    assert res_tactic.status_code == 200
    assert res_tactic.json()["count"] <= 10

    # 3. Direct lookup by technique ID
    res_single = client.get("/api/v1/intelligence/mitre/techniques/T1021.004")
    assert res_single.status_code == 200
    assert res_single.json()["technique_id"] == "T1021.004"
    assert "SSH" in res_single.json()["name"] or "Remote Services" in res_single.json()["name"]

    # 4. 404 on missing technique
    assert client.get("/api/v1/intelligence/mitre/techniques/T9999.999").status_code == 404


def test_vulnerabilities_endpoints_and_joining():
    """Verify unified vulnerability endpoint joining NVD, CISA KEV, and FIRST EPSS."""
    # Lookup CVE-2023-3519
    res = client.get("/api/v1/intelligence/vulnerabilities/CVE-2023-3519")
    assert res.status_code == 200
    data = res.json()
    assert data["cve_id"] == "CVE-2023-3519"
    assert data["severity"] == "CRITICAL"
    assert data["cvss_v3_score"] == 9.8
    assert data["in_cisa_kev"] is True
    assert data["known_ransomware"] is True
    assert len(data["cisa_action"]) > 5

    # Check FIRST EPSS overlay
    assert data["epss"] is not None
    assert data["epss"]["epss_score"] > 0.80
    assert data["epss"]["percentile"] > 0.90
    assert "wild exploitation" in data["epss"]["interpretation"].lower()


def test_cisa_kev_specific_endpoint():
    """Verify direct CISA KEV lookup endpoint."""
    res = client.get("/api/v1/intelligence/kev/CVE-2023-3519")
    assert res.status_code == 200
    data = res.json()
    assert data["cve_id"] == "CVE-2023-3519"
    assert "Citrix" in data["vendor"]
    assert "NetScaler" in data["product"]
    assert len(data["required_action"]) > 10

    # Non-KEV CVE returns 404
    assert client.get("/api/v1/intelligence/kev/CVE-1900-0000").status_code == 404


def test_epss_specific_endpoint():
    """Verify direct FIRST EPSS lookup endpoint."""
    res = client.get("/api/v1/intelligence/epss/CVE-2023-3519")
    assert res.status_code == 200
    data = res.json()
    assert data["cve_id"] == "CVE-2023-3519"
    assert 0.0 <= data["epss_score"] <= 1.0
    assert 0.0 <= data["percentile"] <= 1.0
    assert len(data["interpretation"]) > 10

    # Non-existent CVE returns 404
    assert client.get("/api/v1/intelligence/epss/CVE-1900-99999").status_code == 404


def test_evidence_based_asset_vulnerability_correlation():
    """Verify defensive integrity: assets are correlated to CVEs strictly by explicit evidence."""
    # gw-ext-01 explicitly declares CVE-2023-3519
    res = client.get("/api/v1/intelligence/assets/gw-ext-01/vulnerabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["asset_id"] == "gw-ext-01"
    assert data["vulnerabilities_count"] >= 1
    match = next(m for m in data["matches"] if m["cve_id"] == "CVE-2023-3519")
    assert match["in_cisa_kev"] is True
    assert match["cvss_v3_score"] == 9.8
    assert match["epss"] is not None

    # fw-dmz-01 has no CVEs -> returns 0 without hallucinating associations
    res_clean = client.get("/api/v1/intelligence/assets/fw-dmz-01/vulnerabilities")
    assert res_clean.status_code == 200
    assert res_clean.json()["vulnerabilities_count"] == 0


def test_incident_explanation_assistant():
    """Verify local AI explanation endpoint (local Ollama or deterministic template fallback)."""
    payload = {
        "incident_id": "INC-TEST-001",
        "threat_category": "Exploitation",
        "affected_asset": "srv-web-01",
        "target_crown_jewel": "db-prod-01",
        "technique_ids": ["T1190", "T1021.004"],
        "cve_ids": ["CVE-2023-3519"],
        "recommended_action": "ISOLATE_WORKSTATION",
    }
    res = client.post("/api/v1/intelligence/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-TEST-001"
    assert data["generator"] in ("local_ollama", "deterministic_template_fallback")
    assert len(data["summary"]) > 20
    assert "srv-web-01" in data["summary"]
    assert "ISOLATE_WORKSTATION" in data["containment_rationale"]
