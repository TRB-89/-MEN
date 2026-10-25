"""Threat Intelligence API Router.

Exposes endpoints for querying MITRE ATT&CK techniques, CISA Known Exploited
Vulnerabilities (KEV), attribution notices, and asset vulnerability enrichment.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Path, BackgroundTasks

from backend.threat_intel.service import threat_intel_service
from backend.threat_intel.schemas import (
    MitreSearchResponse,
    MitreTechnique,
    CisaKevSearchResponse,
    CisaKevVulnerability,
    ThreatIntelSummaryResponse,
    AssetVulnEnrichmentResponse,
)
from backend.graph_engine.topology import DEVICE_DATA

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])


@router.get("/summary", response_model=ThreatIntelSummaryResponse)
def get_threat_intel_summary():
    """Retrieve operational status, catalog versions, technique counts, and attribution."""
    return threat_intel_service.get_summary()


@router.get("/attribution")
def get_threat_intel_attribution():
    """Retrieve official copyright notices, licensing terms, and repository links."""
    summary = threat_intel_service.get_summary()
    return {
        "attribution": summary.get("attribution", {}),
        "disclaimer": (
            "ØMEN threat intelligence is provided for defensive analysis and simulation. "
            "MITRE ATT&CK techniques reflect observed adversarial tactics, not attack probabilities. "
            "CVE associations require explicit evidence."
        ),
    }


@router.get("/mitre", response_model=MitreSearchResponse)
def search_mitre_techniques(
    q: Optional[str] = Query(None, description="Search keyword or technique ID (e.g. T1190, credential)"),
    tactic: Optional[str] = Query(None, description="Filter by tactic (e.g. initial-access, lateral-movement)"),
    platform: Optional[str] = Query(None, description="Filter by platform (e.g. Windows, Linux)"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Search the official MITRE ATT&CK Enterprise Matrix techniques."""
    return threat_intel_service.search_mitre(
        query=q,
        tactic=tactic,
        platform=platform,
        limit=limit,
        offset=offset,
    )


@router.get("/mitre/{technique_id}", response_model=MitreTechnique)
def get_mitre_technique(
    technique_id: str = Path(..., description="Technique ID (e.g. T1190 or T1021.004)")
):
    """Retrieve full details for a specific MITRE ATT&CK technique."""
    tech = threat_intel_service.get_mitre_technique(technique_id)
    if not tech:
        raise HTTPException(
            status_code=404,
            detail=f"MITRE ATT&CK technique '{technique_id}' not found in Enterprise Matrix.",
        )
    return tech


@router.get("/cisa-kev", response_model=CisaKevSearchResponse)
def search_cisa_kev_vulnerabilities(
    q: Optional[str] = Query(None, description="Search keyword, CVE ID, or description snippet"),
    vendor: Optional[str] = Query(None, description="Filter by vendor/project (e.g. Microsoft, Citrix, Cisco)"),
    product: Optional[str] = Query(None, description="Filter by product name"),
    ransomware_only: bool = Query(False, description="Filter exclusively for vulnerabilities with known ransomware campaign usage"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Search the CISA Known Exploited Vulnerabilities (KEV) Catalog."""
    return threat_intel_service.search_cisa_kev(
        query=q,
        vendor=vendor,
        product=product,
        ransomware_only=ransomware_only,
        limit=limit,
        offset=offset,
    )


@router.get("/cisa-kev/{cve_id}", response_model=CisaKevVulnerability)
def get_cisa_kev_vulnerability(
    cve_id: str = Path(..., description="CVE identifier (e.g. CVE-2023-3519)")
):
    """Retrieve official CISA KEV entry and mandated mitigation action for a CVE."""
    cve = threat_intel_service.get_cisa_kev_cve(cve_id)
    if not cve:
        raise HTTPException(
            status_code=404,
            detail=f"CVE '{cve_id}' not found in CISA Known Exploited Vulnerabilities catalog.",
        )
    return cve


@router.get("/assets/{asset_id}/vulnerabilities", response_model=AssetVulnEnrichmentResponse)
def get_asset_vulnerability_enrichment(
    asset_id: str = Path(..., description="Target network asset identifier (e.g. gw-ext-01, srv-web-01)")
):
    """Correlate explicitly documented CVEs on a network asset with CISA KEV remediation requirements.
    
    Adheres strictly to evidence matching: only CVEs directly referenced on the asset
    are resolved. Does not fabricate CVE links without evidence.
    """
    # 1. Search in memory topology
    target_asset = next((d for d in DEVICE_DATA if d["id"] == asset_id), None)

    # 2. Search in database if not found in memory
    if not target_asset:
        from backend.database.db import SessionLocal, NetworkAsset
        db = SessionLocal()
        try:
            db_asset = db.query(NetworkAsset).filter(NetworkAsset.id == asset_id).first()
            if db_asset:
                target_asset = db_asset.to_dict()
        finally:
            db.close()

    if not target_asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found in network topology.")

    matches = threat_intel_service.match_asset_vulnerabilities(target_asset)
    kev_count = sum(1 for m in matches if m.get("in_cisa_kev"))

    return {
        "asset_id": asset_id,
        "asset_name": target_asset.get("name", asset_id),
        "vulnerabilities_count": len(matches),
        "cisa_kev_matches_count": kev_count,
        "matches": matches,
        "attribution_notice": "Vulnerability intelligence correlated against CISA KEV Catalog under CC0 1.0 Universal.",
    }


@router.post("/sync")
def trigger_threat_intel_sync(background_tasks: BackgroundTasks, force: bool = Query(True)):
    """Trigger synchronization with official MITRE and CISA GitHub repositories."""
    from backend.threat_intel.fetch_data import sync_all_datasets

    def do_sync():
        sync_all_datasets(force=force)
        threat_intel_service.initialize(auto_fetch=False)

    background_tasks.add_task(do_sync)
    return {
        "status": "sync_initiated",
        "message": "Threat intelligence background synchronization started.",
        "sources": [
            "https://github.com/mitre-attack/attack-stix-data",
            "https://github.com/cisagov/kev-data"
        ],
    }
