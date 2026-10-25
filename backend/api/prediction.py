"""FastAPI Endpoints for Module 3: Predictive Attack Path Intelligence Engine.

Provides predictive attack path discovery, ranking, MITRE ATT&CK technique mapping,
critical asset reachability analysis, historical query, and engine health endpoints.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import networkx as nx

from backend.database.db import get_db, AttackPathPredictionRecord, NetworkAssetRecord
from backend.path_prediction.schemas import (
    AttackPathPredictionRequest,
    AttackPathPredictionResponse,
    PredictionHistoryItem,
    CriticalAssetItem,
    EngineHealthResponse,
)
from backend.path_prediction.prediction_service import execute_attack_path_prediction
from backend.path_prediction.graph_loader import load_prediction_graph
from backend.path_prediction.path_analyzer import find_attack_paths
from backend.graph_engine.topology import DEVICE_DATA

router = APIRouter(tags=["Attack Path Prediction (Module 3)"])


# --- Primary Module 3 Endpoints ---

@router.post("/attack-paths/predict", response_model=AttackPathPredictionResponse)
def predict_attack_paths_v2(
    request: AttackPathPredictionRequest,
    db: Session = Depends(get_db),
):
    """Execute explainable attack-path forecasting and risk scoring from source to destination asset."""
    try:
        response = execute_attack_path_prediction(request, db=db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Attack path prediction failed: {str(e)}",
        )


@router.get("/attack-paths/history", response_model=List[PredictionHistoryItem])
def get_attack_path_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical prediction assessments persisted in SQLite Incident Memory."""
    try:
        records = (
            db.query(AttackPathPredictionRecord)
            .order_by(AttackPathPredictionRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            PredictionHistoryItem(
                prediction_id=r.id,
                timestamp=r.created_at.isoformat() if r.created_at else "",
                source_asset_id=r.source_asset_id,
                target_asset_id=r.target_asset_id,
                total_paths=r.total_paths,
                highest_risk_score=r.highest_risk_score,
                risk_category=r.risk_category,
                scoring_version=r.scoring_version,
                is_simulation=bool(r.is_simulation),
            )
            for r in records
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query prediction history: {str(e)}",
        )


@router.get("/attack-paths/critical-assets", response_model=List[CriticalAssetItem])
def get_critical_assets(db: Session = Depends(get_db)):
    """Retrieve all high-value and crown-jewel assets eligible as attack-path targets."""
    try:
        assets = (
            db.query(NetworkAssetRecord)
            .filter(NetworkAssetRecord.criticality.in_(["CRITICAL", "HIGH"]))
            .all()
        )
        if assets:
            return [
                CriticalAssetItem(
                    id=a.id,
                    name=a.name,
                    zone=a.zone,
                    criticality=a.criticality,
                    asset_type=a.asset_type,
                    ip=a.ip,
                    vuln_score=a.vuln_score,
                    security_status=a.security_status,
                )
                for a in assets
            ]
    except Exception:
        pass

    # Fallback to DEVICE_DATA
    high_value = [d for d in DEVICE_DATA if d.get("criticality") in ("CRITICAL", "HIGH")]
    return [
        CriticalAssetItem(
            id=d["id"],
            name=d["name"],
            zone=d.get("zone", "Core"),
            criticality=d.get("criticality", "HIGH"),
            asset_type=d.get("device_type", "server"),
            ip=d.get("ip"),
            vuln_score=float(d.get("vuln_score", 0.5)),
            security_status="COMPROMISED" if d.get("compromised") else "SECURE",
        )
        for d in high_value
    ]


@router.get("/attack-paths/health", response_model=EngineHealthResponse)
def get_attack_paths_engine_health(db: Session = Depends(get_db)):
    """Return runtime diagnostic status and graph metric state for Module 3."""
    G, _ = load_prediction_graph(db)
    density = nx.density(G) if len(G.nodes) > 1 else 0.0

    return EngineHealthResponse(
        status="ONLINE",
        engine="ØMEN Heuristic Attack Path Intelligence Engine",
        version="OMEN-AP-2.1",
        algorithm="NetworkX Bounded Depth-First Traversal & Dijkstra Friction Shortest-Path",
        topology_loaded=len(G.nodes) > 0,
        total_nodes=len(G.nodes),
        total_edges=len(G.edges),
        graph_density=round(density, 4),
        scoring_model="Multi-factor Normalized Risk Function (Criticality, Vuln Density, Privilege, Telemetry Evidence, Hop Velocity)",
    )


@router.get("/attack-paths/{prediction_id}")
def get_prediction_by_id(
    prediction_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve full details of a previously computed attack-path prediction by ID."""
    record = (
        db.query(AttackPathPredictionRecord)
        .filter(AttackPathPredictionRecord.id == prediction_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction ID '{prediction_id}' not found in Incident Memory.",
        )
    return record.to_dict()


# --- Backwards Compatibility Endpoints for /api/v1/prediction/* ---

class AttackPathRequest(BaseModel):
    source_node: str = Field(default="srv-web-01", description="Breach entry foothold node")
    target_node: Optional[str] = Field(default=None, description="Crown jewel destination (optional)")
    isolated_nodes: Optional[List[str]] = Field(default=[], description="Currently isolated network nodes")
    max_hops: int = Field(default=5, ge=1, le=8, description="Maximum traversal search depth")


@router.post("/prediction/attack-paths")
def predict_attack_paths_legacy(
    request: AttackPathRequest,
    db: Session = Depends(get_db),
):
    """Legacy compatibility endpoint returning structured attack paths."""
    v2_req = AttackPathPredictionRequest(
        source_asset_id=request.source_node,
        target_asset_id=request.target_node,
        max_depth=request.max_hops,
        top_k=10,
        isolated_nodes=request.isolated_nodes,
        simulation_mode=True,
    )
    v2_res = execute_attack_path_prediction(v2_req, db=db)

    # Format into legacy client dictionary structure
    return {
        "source_node": v2_res.source_asset_id,
        "source_name": v2_res.source_asset_name,
        "total_paths_discovered": v2_res.total_candidate_paths,
        "isolated_nodes_active": request.isolated_nodes or [],
        "paths": [
            {
                "path_id": p.path_id,
                "target_node": p.target_node,
                "target_name": p.target_name,
                "nodes": p.nodes,
                "hops": p.hops,
                "risk_score": p.risk_score,
                "estimated_time_mins": p.estimated_time_mins,
                "hop_details": [
                    {
                        "from_node": h.from_node,
                        "to_node": h.to_node,
                        "protocol": h.protocol,
                        "port": h.port,
                        "mitre_technique": f"{h.mitre_technique_id} - {h.mitre_technique_name}",
                        "hop_risk": h.hop_risk_score,
                        "estimated_time_mins": h.estimated_traversal_time_mins,
                    }
                    for h in p.hop_details
                ],
            }
            for p in v2_res.candidate_paths
        ],
        "critical_chokepoints": [
            {
                "node_id": c.node_id,
                "name": c.name,
                "frequency": c.frequency,
                "criticality": c.criticality,
            }
            for c in v2_res.critical_chokepoints
        ],
        "prediction_id": v2_res.prediction_id,
        "scoring_version": v2_res.scoring_engine_version,
    }


@router.get("/prediction/high-risk-targets")
def get_high_risk_targets_legacy(db: Session = Depends(get_db)):
    """Legacy alias identifying enterprise assets designated as CRITICAL or HIGH risk."""
    return get_critical_assets(db=db)
