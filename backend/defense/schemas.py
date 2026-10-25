"""Pydantic schemas and typed data contracts for Module 4: Autonomous Defense Simulation Engine."""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class DefenseActionType:
    WORKSTATION_ISOLATION = "WORKSTATION_ISOLATION"
    CONNECTION_RESTRICTION = "CONNECTION_RESTRICTION"
    SESSION_REVOCATION = "SESSION_REVOCATION"
    ENHANCED_MONITORING = "ENHANCED_MONITORING"


class DefenseActionDefinition(BaseModel):
    action_type: str
    target_entity: str
    target_name: str
    target_zone: Optional[str] = None
    target_edge: Optional[Dict[str, Any]] = None
    description: str
    disruption_level: str  # NONE, LOW, MEDIUM, HIGH, CRITICAL
    disruption_cost: float  # 0.0 to 100.0


class SimulationMetrics(BaseModel):
    blast_radius_before: int
    blast_radius_after: int
    containment_efficacy_pct: float
    severed_edges_count: int
    critical_assets_saved_count: int
    residual_critical_exposed_count: int
    risk_score_before: float
    risk_score_after: float
    risk_reduction_pct: float
    operational_disruption_score: float
    net_defensive_utility: float


class BusinessImpactAnalysis(BaseModel):
    disrupted_legitimate_services: List[str]
    affected_departments: List[str]
    estimated_downtime_minutes: float
    operational_friction: str
    critical_business_functions_maintained: List[str]


class DefenseSimulationRequest(BaseModel):
    action_type: str = Field(
        default="WORKSTATION_ISOLATION",
        description="Action type: WORKSTATION_ISOLATION, CONNECTION_RESTRICTION, SESSION_REVOCATION, ENHANCED_MONITORING",
    )
    target_entity: str = Field(
        default="ws-dev-04",
        description="Node ID to isolate, or edge identifier 'source->target' to restrict/revoke",
    )
    entry_node: str = Field(
        default="srv-web-01",
        description="Assumed adversary foothold or entry node",
    )
    target_asset_id: Optional[str] = Field(
        default="db-prod-01",
        description="Crown-jewel asset to evaluate reachability against",
    )
    prediction_id: Optional[str] = Field(
        default=None,
        description="Associated Module 3 attack-path prediction ID",
    )
    max_hops: int = Field(default=5, ge=1, le=8)


class DefenseRecommendationItem(BaseModel):
    recommendation_id: str
    rank: int
    action_type: str
    target_entity: str
    target_name: str
    target_zone: str
    projected_risk_reduction_pct: float
    operational_disruption_pct: float
    net_utility_score: float
    confidence_score: float
    rationale: str
    affected_paths_count: int
    critical_assets_shielded: int
    decision_tradeoff: str


class DefenseRecommendationRequest(BaseModel):
    prediction_id: Optional[str] = Field(
        default=None,
        description="Module 3 prediction ID to base containment recommendations upon",
    )
    entry_node: Optional[str] = Field(
        default="srv-web-01",
        description="Adversary foothold if prediction_id is omitted",
    )
    target_asset_id: Optional[str] = Field(
        default="db-prod-01",
        description="Crown-jewel target to shield",
    )
    max_recommendations: int = Field(default=5, ge=1, le=10)
    risk_weight: float = Field(default=0.7, ge=0.0, le=1.0)
    disruption_weight: float = Field(default=0.3, ge=0.0, le=1.0)


class DefenseSimulationResponse(BaseModel):
    simulation_id: str
    timestamp: str
    action_type: str
    target_entity: str
    target_name: str
    entry_node: str
    entry_node_name: str
    crown_jewel_target: Optional[str]
    topology_snapshot_id: str
    prediction_id: Optional[str]
    metrics: SimulationMetrics
    business_impact: BusinessImpactAnalysis
    reachability_comparison: Dict[str, List[str]]
    interrupted_attack_paths: List[str]
    remaining_attack_paths: List[Dict[str, Any]]
    explanation: str
    assumptions: List[str]
    approval_status: str
    disclaimer: str = (
        "AUTONOMOUS DEFENSE SIMULATION: Modeled in isolated synthetic graph. "
        "No real network configurations, firewalls, or production endpoints were modified."
    )


class DefenseRecommendationResponse(BaseModel):
    recommendation_id: str
    timestamp: str
    entry_node: str
    crown_jewel_target: Optional[str]
    prediction_id: Optional[str]
    topology_snapshot_id: str
    recommended_strategy: DefenseRecommendationItem
    alternative_strategies: List[DefenseRecommendationItem]
    scoring_weights: Dict[str, float]
    summary: str
    disclaimer: str


class DefenseApprovalRequest(BaseModel):
    simulation_id: str
    analyst_id: str = Field(default="secops_operator")
    decision: str = Field(default="APPROVED", description="APPROVED or REJECTED")
    notes: Optional[str] = Field(default="Analyst verified operational tolerance.")


class DefenseApprovalResponse(BaseModel):
    approval_id: str
    simulation_id: str
    analyst_id: str
    decision: str
    notes: Optional[str]
    approved_at: str
    audit_message: str


class DefenseHistoryItem(BaseModel):
    simulation_id: str
    timestamp: str
    action_type: str
    target_entity: str
    risk_before: float
    risk_after: float
    risk_reduction_pct: float
    disruption_score: float
    approval_status: str


class DefenseEngineHealth(BaseModel):
    status: str
    engine: str
    version: str
    supported_actions: List[str]
    baseline_topology_nodes: int
    baseline_topology_edges: int
    isolation_safety_guarantee: str
