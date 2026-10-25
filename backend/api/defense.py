import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.defense.defense_simulator import simulate_isolation, recommend_defensive_actions
from backend.database.db import get_db, SimulationRun

router = APIRouter(prefix="/defense", tags=["Autonomous Defense Simulation"])


class IsolationSimulationRequest(BaseModel):
    isolated_node_ids: List[str] = Field(..., json_schema_extra={"example": ["ws-dev-04"]}, description="Nodes to simulate isolating")
    entry_node: str = Field(default="srv-web-01", description="Assumed attacker foothold node")


@router.post("/simulate-isolation")
def run_isolation_simulation(request: IsolationSimulationRequest, db: Session = Depends(get_db)):
    """Simulate isolation of workstations/servers and calculate pre/post blast radius metrics."""
    result = simulate_isolation(
        isolated_node_ids=request.isolated_node_ids,
        entry_node=request.entry_node,
    )

    # Persist simulation run in database
    try:
        sim_run = SimulationRun(
            id=f"SIM-{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc),
            simulation_type="WORKSTATION_ISOLATION",
            isolated_nodes=json.dumps(request.isolated_node_ids),
            blast_radius_before=result["metrics"]["blast_radius_before"],
            blast_radius_after=result["metrics"]["blast_radius_after"],
            containment_score=result["metrics"]["containment_efficacy_pct"],
            summary=result["summary"],
        )
        db.add(sim_run)
        db.commit()
        result["simulation_id"] = sim_run.id
    except Exception as e:
        db.rollback()

    return result


@router.get("/recommendations")
def get_containment_recommendations(entry_node: str = Query("srv-web-01", description="Attacker foothold node")):
    """Get automated containment recommendations to optimize blast radius reduction."""
    return {
        "entry_node": entry_node,
        "recommendations": recommend_defensive_actions(entry_node=entry_node),
    }
