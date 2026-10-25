"""Module 4 Defense Simulation Integration Contract.

Defines the exported data structures and containment handoff payloads provided by
Module 3 (Attack Path Prediction) to Module 4 (Autonomous Defense Simulation).
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ContainmentCandidate(BaseModel):
    node_id: str = Field(..., description="Target node identifier to isolate")
    node_name: str
    criticality: str
    blast_radius_reduction_pct: float
    affected_paths_count: int
    recommendation_reason: str


class DefenseSimulationHandoff(BaseModel):
    prediction_id: str
    source_asset_id: str
    critical_target_id: Optional[str]
    topology_snapshot_id: str
    ranked_candidate_paths: List[Dict[str, Any]]
    affected_assets: List[str]
    primary_risk_factors: Dict[str, float]
    available_containment_points: List[ContainmentCandidate]
    scoring_version: str = "OMEN-AP-2.1"
    handoff_timestamp: str
