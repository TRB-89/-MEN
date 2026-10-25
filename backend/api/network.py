"""FastAPI Router for Module 2: Attack Graph Intelligence.

Exposes comprehensive endpoints for enterprise network topology, individual assets,
relationships, correlated alerts, unmatched events, and synthetic scenario simulations.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.database.db import (
    get_db,
    NetworkAssetRecord,
    NetworkRelationshipRecord,
    NetworkAlertRecord,
)
from backend.graph_engine.topology import (
    export_topology,
    get_asset_details,
    get_network_relationships,
    load_simulation_scenario,
    get_device,
    DEVICE_DATA,
)

router = APIRouter(prefix="/network", tags=["Network Attack Graph Intelligence (Module 2)"])


class ScenarioLoadRequest(BaseModel):
    scenario_type: str = Field(
        ...,
        description="Scenario preset to load: 'baseline', 'kerberoasting', 'dmz_foothold', 'ransomware_staging', 'zero_trust_isolated'",
        examples=["kerberoasting"],
    )


# 1. GET /api/v1/network/graph
@router.get("/graph")
def get_network_graph(
    isolated_nodes: Optional[str] = Query(None, description="Comma-separated list of isolated device IDs"),
    db: Session = Depends(get_db),
):
    """Retrieve full enterprise attack graph topology with metrics, alerts, and isolated nodes."""
    iso_list = [n.strip() for n in isolated_nodes.split(",") if n.strip()] if isolated_nodes else []
    return export_topology(isolated_nodes=iso_list, db=db)


# 2. GET /api/v1/network/assets
@router.get("/assets")
def list_network_assets(
    zone: Optional[str] = Query(None, description="Filter by network zone (Perimeter, DMZ, Core, Corporate, Restricted)"),
    criticality: Optional[str] = Query(None, description="Filter by criticality level (LOW, MEDIUM, HIGH, CRITICAL)"),
    security_status: Optional[str] = Query(None, description="Filter by security status (SECURE, SUSPICIOUS, COMPROMISED, ISOLATED)"),
    search: Optional[str] = Query(None, description="Search term for name, ID, or IP"),
    db: Session = Depends(get_db),
):
    """List all enterprise network assets with optional filtering and search."""
    query = db.query(NetworkAssetRecord)

    if zone and zone.upper() != "ALL":
        query = query.filter(NetworkAssetRecord.zone.ilike(f"%{zone}%"))
    if criticality and criticality.upper() != "ALL":
        query = query.filter(NetworkAssetRecord.criticality.ilike(criticality))
    if security_status and security_status.upper() != "ALL":
        query = query.filter(NetworkAssetRecord.security_status.ilike(security_status))

    assets = query.all()
    results = [a.to_dict() for a in assets]

    if search:
        s = search.lower().strip()
        results = [
            a for a in results
            if s in a["name"].lower() or s in a["id"].lower() or (a.get("ip") and s in a["ip"].lower())
        ]

    return {
        "count": len(results),
        "total_assets": len(results),
        "assets": results,
    }


# 3. GET /api/v1/network/assets/{asset_id}
@router.get("/assets/{asset_id}")
def get_single_asset(asset_id: str, db: Session = Depends(get_db)):
    """Retrieve in-depth details for a specific asset including neighbors, reachable crown jewels, and alerts."""
    asset = get_asset_details(asset_id, db=db)
    if not asset:
        raise HTTPException(
            status_code=404,
            detail=f"Asset '{asset_id}' not found in enterprise network topology.",
        )
    return asset


# 4. GET /api/v1/network/relationships
@router.get("/relationships")
def list_network_relationships(db: Session = Depends(get_db)):
    """Retrieve all directed network relationships with permissions and telemetry source."""
    relationships = get_network_relationships(db=db)
    return {
        "count": len(relationships),
        "relationships": relationships,
    }


# 5. GET /api/v1/network/alerts
@router.get("/alerts")
def list_network_alerts(
    asset_id: Optional[str] = Query(None, description="Filter alerts by specific asset ID"),
    severity: Optional[str] = Query(None, description="Filter alerts by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve correlated network alerts linked to enterprise assets."""
    query = db.query(NetworkAlertRecord).filter(NetworkAlertRecord.is_matched == 1)

    if asset_id:
        query = query.filter(NetworkAlertRecord.asset_id == asset_id)
    if severity and severity.upper() != "ALL":
        query = query.filter(NetworkAlertRecord.severity.ilike(severity))

    alerts = query.order_by(NetworkAlertRecord.timestamp.desc()).limit(limit).all()
    return {
        "count": len(alerts),
        "alerts": [a.to_dict() for a in alerts],
    }


# 6. GET /api/v1/network/unmatched-events
@router.get("/unmatched-events")
def list_unmatched_events(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve security events that could not be correlated to a known topology asset."""
    unmatched = (
        db.query(NetworkAlertRecord)
        .filter(NetworkAlertRecord.is_matched == 0)
        .order_by(NetworkAlertRecord.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {
        "count": len(unmatched),
        "unmatched_events": [u.to_dict() for u in unmatched],
    }


# 7. POST /api/v1/network/simulations/load
@router.post("/simulations/load")
def load_scenario(request: ScenarioLoadRequest, db: Session = Depends(get_db)):
    """Load or reset a synthetic attack scenario and return the updated graph state."""
    try:
        result = load_simulation_scenario(db, request.scenario_type)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load scenario '{request.scenario_type}': {str(e)}",
        )


# --- Backwards Compatibility Aliases ---
@router.get("/nodes")
def list_network_nodes(db: Session = Depends(get_db)):
    """Compatibility alias for listing all devices."""
    assets = db.query(NetworkAssetRecord).all()
    devs = [a.to_dict() for a in assets] if assets else DEVICE_DATA
    return {
        "count": len(devs),
        "devices": devs,
    }


@router.get("/devices/{device_id}")
def get_device_details_alias(device_id: str, db: Session = Depends(get_db)):
    """Compatibility alias for single device lookup."""
    dev = get_device(device_id, db=db)
    if not dev:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")
    return dev
