"""FastAPI Endpoints for Module 4: Autonomous Defense Simulation Engine.

Provides endpoints for defense strategy recommendations, isolated simulation runs,
human-in-the-loop approval audits, simulation history retrieval, and engine diagnostics.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import networkx as nx

from backend.database.db import get_db, DefenseSimulationRecord, DefenseApprovalRecord
from backend.defense.schemas import (
    DefenseActionType,
    DefenseActionDefinition,
    DefenseRecommendationRequest,
    DefenseRecommendationResponse,
    DefenseSimulationRequest,
    DefenseSimulationResponse,
    DefenseApprovalRequest,
    DefenseApprovalResponse,
    DefenseHistoryItem,
    DefenseEngineHealth,
)
from backend.defense.recommendation_service import (
    generate_defense_recommendations,
    execute_defense_simulation_and_persist,
    record_defense_approval,
)
from backend.defense.defense_simulator import simulate_isolation, recommend_defensive_actions
from backend.path_prediction.graph_loader import load_prediction_graph

router = APIRouter(prefix="/defense", tags=["Autonomous Defense Simulation (Module 4)"])


# --- Primary Module 4 Endpoints ---

@router.post("/recommend", response_model=DefenseRecommendationResponse)
def get_defense_recommendations(
    request: DefenseRecommendationRequest,
    db: Session = Depends(get_db),
):
    """Generate multi-objective containment recommendations balancing risk reduction against business disruption."""
    try:
        return generate_defense_recommendations(request, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate defense recommendations: {str(e)}",
        )


@router.post("/simulate", response_model=DefenseSimulationResponse)
def execute_simulation(
    request: DefenseSimulationRequest,
    db: Session = Depends(get_db),
):
    """Execute an isolated before-and-after defensive simulation run and persist metrics."""
    try:
        return execute_defense_simulation_and_persist(request, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Defense simulation failed: {str(e)}",
        )


@router.post("/approve", response_model=DefenseApprovalResponse)
def approve_defense_plan(
    request: DefenseApprovalRequest,
    db: Session = Depends(get_db),
):
    """Record human SecOps analyst approval or rejection of a simulated containment strategy."""
    try:
        return record_defense_approval(request, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Approval registration failed: {str(e)}",
        )


@router.get("/actions", response_model=List[Dict[str, Any]])
def list_supported_defense_actions():
    """Retrieve catalog of supported defensive action types with impact descriptions."""
    return [
        {
            "action_type": DefenseActionType.WORKSTATION_ISOLATION,
            "label": "Host / Workstation Isolation",
            "description": "Quarantines target host from all lateral ingress/egress network traffic.",
            "operational_impact": "High for shared infrastructure; low for single workstations.",
            "reversibility": "Immediate (single click reset).",
        },
        {
            "action_type": DefenseActionType.CONNECTION_RESTRICTION,
            "label": "Targeted Connection Restriction",
            "description": "Selectively severs a specific protocol channel or firewall port between two nodes.",
            "operational_impact": "Moderate (disables one route while leaving alternate services online).",
            "reversibility": "Immediate.",
        },
        {
            "action_type": DefenseActionType.SESSION_REVOCATION,
            "label": "Privileged Session Revocation",
            "description": "Terminates active Kerberos tickets and cached domain logon sessions.",
            "operational_impact": "Minimal (forces operator to re-authenticate with MFA).",
            "reversibility": "Transparent re-authentication.",
        },
        {
            "action_type": DefenseActionType.ENHANCED_MONITORING,
            "label": "Enhanced Telemetry & Canary Sensors",
            "description": "Deploys aggressive packet inspection and synthetic deception canaries on junction nodes.",
            "operational_impact": "None (zero legitimate disruption).",
            "reversibility": "Passive observation toggle.",
        },
    ]


@router.get("/simulations", response_model=List[DefenseHistoryItem])
def get_simulation_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical defense simulations recorded in SQLite Incident Memory."""
    try:
        records = (
            db.query(DefenseSimulationRecord)
            .order_by(DefenseSimulationRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            DefenseHistoryItem(
                simulation_id=r.id,
                timestamp=r.created_at.isoformat() if r.created_at else "",
                action_type=r.action_type,
                target_entity=r.target_entity,
                risk_before=r.risk_before,
                risk_after=r.risk_after,
                risk_reduction_pct=r.risk_reduction_pct,
                disruption_score=r.disruption_score,
                approval_status=r.approval_status,
            )
            for r in records
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query simulation history: {str(e)}",
        )


@router.get("/simulations/{simulation_id}")
def get_simulation_detail(
    simulation_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve full before-and-after audit details of a previous simulation run."""
    record = (
        db.query(DefenseSimulationRecord)
        .filter(DefenseSimulationRecord.id == simulation_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation ID '{simulation_id}' not found.",
        )
    return record.to_dict()


@router.get("/health", response_model=DefenseEngineHealth)
def get_defense_engine_health(db: Session = Depends(get_db)):
    """Return runtime diagnostic status and topology baseline metrics for Module 4."""
    G, _ = load_prediction_graph(db=db)
    return DefenseEngineHealth(
        status="ONLINE",
        engine="ØMEN Autonomous Defense Simulation Engine",
        version="OMEN-DEF-2.1",
        supported_actions=[
            DefenseActionType.WORKSTATION_ISOLATION,
            DefenseActionType.CONNECTION_RESTRICTION,
            DefenseActionType.SESSION_REVOCATION,
            DefenseActionType.ENHANCED_MONITORING,
        ],
        baseline_topology_nodes=len(G.nodes),
        baseline_topology_edges=len(G.edges),
        isolation_safety_guarantee="Strict graph copy isolation. Zero mutation to live network infrastructure.",
    )


# --- Legacy Backwards Compatibility Endpoints ---

class IsolationSimulationRequest(BaseModel):
    isolated_node_ids: List[str] = Field(..., description="Nodes to simulate isolating")
    entry_node: str = Field(default="srv-web-01", description="Assumed attacker foothold node")


@router.post("/simulate-isolation")
def run_isolation_simulation_legacy(
    request: IsolationSimulationRequest,
    db: Session = Depends(get_db),
):
    """Legacy compatibility endpoint simulating multi-node workstation isolation."""
    return simulate_isolation(
        isolated_node_ids=request.isolated_node_ids,
        entry_node=request.entry_node,
    )


@router.get("/recommendations")
def get_containment_recommendations_legacy(
    entry_node: str = Query("srv-web-01", description="Attacker foothold node")
):
    """Legacy alias returning basic blast radius containment candidates."""
    return {
        "entry_node": entry_node,
        "recommendations": recommend_defensive_actions(entry_node=entry_node),
    }
