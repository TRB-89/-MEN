"""Threat Intelligence API Router (Part 9 Compliant).

Exposes standardized endpoints for MITRE ATT&CK techniques, NVD vulnerability data,
CISA KEV catalog entries, and FIRST EPSS probability scores.
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Path, BackgroundTasks

from backend.threat_intelligence.intelligence_service import intelligence_service
from backend.threat_intelligence.schemas import (
    IntelligenceStatusResponse,
    MitreQueryResponse,
    MitreTechniqueRecord,
    VulnerabilityQueryResponse,
    VulnerabilityRecord,
    CisaKevRecord,
    EpssRecord,
    IncidentExplanationRequest,
    IncidentExplanationResponse,
)
from backend.threat_intelligence.ollama_assistant import generate_incident_explanation
from backend.graph_engine.topology import DEVICE_DATA

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])


@router.get("/status", response_model=IntelligenceStatusResponse)
def get_intelligence_status():
    """Retrieve operational status, summary counts, and attribution for all intelligence sources."""
    return intelligence_service.get_status()


@router.get("/attribution")
def get_intelligence_attribution():
    """Retrieve licensing, copyright, and official repository links for public audit."""
    status = intelligence_service.get_status()
    return {
        "sources": status.attribution,
        "disclaimer": status.disclaimer,
        "last_synced_utc": status.last_synced_utc,
    }


@router.get("/mitre/techniques", response_model=MitreQueryResponse)
def list_mitre_techniques(
    q: Optional[str] = Query(None, description="Search keyword, technique ID, or title"),
    tactic: Optional[str] = Query(None, description="Filter by tactic (e.g. lateral-movement, initial-access)"),
    platform: Optional[str] = Query(None, description="Filter by target platform (e.g. Windows, Linux)"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Query MITRE ATT&CK Enterprise Matrix techniques."""
    return intelligence_service.query_mitre(
        query=q,
        tactic=tactic,
        platform=platform,
        limit=limit,
        offset=offset,
    )


@router.get("/mitre/techniques/{technique_id}", response_model=MitreTechniqueRecord)
def get_mitre_technique(
    technique_id: str = Path(..., description="Technique ID (e.g. T1190 or T1021.004)")
):
    """Retrieve detailed description, detection strategies, and official references for an ATT&CK technique."""
    tech = intelligence_service.get_mitre_technique(technique_id)
    if not tech:
        raise HTTPException(
            status_code=404,
            detail=f"MITRE ATT&CK technique '{technique_id}' not found in local enterprise catalog.",
        )
    return tech


@router.get("/vulnerabilities", response_model=VulnerabilityQueryResponse)
def list_vulnerabilities(
    q: Optional[str] = Query(None, description="Search keyword, CVE ID, or affected product"),
    severity: Optional[str] = Query(None, description="Filter by CVSS severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    kev_only: bool = Query(False, description="Filter exclusively for vulnerabilities cataloged in CISA KEV"),
    limit: int = Query(50, ge=1, le=200, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Query unified vulnerability catalog enriched with CVSS scores, CISA KEV flags, and EPSS probabilities."""
    return intelligence_service.query_vulnerabilities(
        query=q,
        severity=severity,
        kev_only=kev_only,
        limit=limit,
        offset=offset,
    )


@router.get("/vulnerabilities/{cve_id}", response_model=VulnerabilityRecord)
def get_vulnerability_record(
    cve_id: str = Path(..., description="CVE identifier (e.g. CVE-2023-3519)")
):
    """Retrieve unified vulnerability record combining NVD, CISA KEV, and FIRST EPSS."""
    vuln = intelligence_service.get_vulnerability(cve_id)
    if not vuln:
        raise HTTPException(
            status_code=404,
            detail=f"Vulnerability '{cve_id}' not found in local threat intelligence catalog.",
        )
    return vuln


@router.get("/kev/{cve_id}", response_model=CisaKevRecord)
def get_cisa_kev_entry(
    cve_id: str = Path(..., description="CVE identifier (e.g. CVE-2023-3519)")
):
    """Retrieve CISA Known Exploited Vulnerability details and mandated remediation action."""
    kev = intelligence_service.get_cisa_kev_record(cve_id)
    if not kev:
        raise HTTPException(
            status_code=404,
            detail=f"CVE '{cve_id}' is not listed in the CISA Known Exploited Vulnerabilities catalog.",
        )
    return kev


@router.get("/epss/{cve_id}", response_model=EpssRecord)
def get_epss_score_entry(
    cve_id: str = Path(..., description="CVE identifier (e.g. CVE-2023-3519)")
):
    """Retrieve FIRST EPSS probability and percentile metrics for a vulnerability."""
    epss = intelligence_service.get_epss_record(cve_id)
    if not epss:
        raise HTTPException(
            status_code=404,
            detail=f"FIRST EPSS probability score not found for '{cve_id}'.",
        )
    return epss


@router.get("/assets/{asset_id}/vulnerabilities")
def get_asset_vulnerability_correlation(
    asset_id: str = Path(..., description="Network asset ID (e.g. gw-ext-01, srv-web-01)")
):
    """Correlate documented asset CVEs with unified CVSS, CISA KEV, and EPSS intelligence.
    
    Adheres strictly to evidence matching: only CVEs directly referenced on the asset
    are resolved. Does not fabricate CVE links without evidence.
    """
    target = next((d for d in DEVICE_DATA if d["id"] == asset_id), None)
    if not target:
        from backend.database.db import SessionLocal, NetworkAsset
        db = SessionLocal()
        try:
            db_asset = db.query(NetworkAsset).filter(NetworkAsset.id == asset_id).first()
            if db_asset:
                target = db_asset.to_dict()
        finally:
            db.close()

    if not target:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found in enterprise topology.")

    matches = intelligence_service.match_asset_vulnerabilities(target)
    return {
        "asset_id": asset_id,
        "asset_name": target.get("name", asset_id),
        "vulnerabilities_count": len(matches),
        "cisa_kev_count": sum(1 for m in matches if m.in_cisa_kev),
        "matches": [m.model_dump() for m in matches],
        "attribution_notice": "Vulnerability metrics synthesized from NVD (NIST), CISA KEV, and FIRST EPSS.",
    }


@router.post("/explain", response_model=IncidentExplanationResponse)
def explain_incident_intelligence(request: IncidentExplanationRequest):
    """Generate technical incident narrative using local Ollama model (with deterministic template fallback)."""
    explanation = generate_incident_explanation(
        incident_id=request.incident_id,
        threat_category=request.threat_category or "Exploitation",
        affected_asset=request.affected_asset or "srv-web-01",
        target_crown_jewel=request.target_crown_jewel or "db-prod-01",
        technique_ids=request.technique_ids,
        cve_ids=request.cve_ids,
        recommended_action=request.recommended_action or "ISOLATE_WORKSTATION",
    )
    return IncidentExplanationResponse(
        incident_id=request.incident_id,
        **explanation
    )


@router.post("/sync")
def sync_intelligence_datasets(background_tasks: BackgroundTasks, force: bool = Query(True)):
    """Trigger background refresh of all threat intelligence feeds."""
    def run_sync():
        intelligence_service.initialize(force_refresh=force)

    background_tasks.add_task(run_sync)
    return {
        "status": "sync_initiated",
        "message": "Unified threat intelligence synchronization started in background.",
        "sources": [
            "https://github.com/mitre-attack/attack-stix-data",
            "https://github.com/cisagov/kev-data",
            "https://github.com/empiricalsec/epss_scores",
            "https://github.com/fkie-cad/nvd-json-data-feeds"
        ],
    }
