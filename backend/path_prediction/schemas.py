"""Pydantic schemas and typed data contracts for Module 3: Attack Path Prediction Engine."""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class AttackPathPredictionRequest(BaseModel):
    source_asset_id: str = Field(
        default="srv-web-01",
        description="Breach entry or suspicious foothold asset ID (e.g. ws-dev-04, srv-web-01)",
    )
    target_asset_id: Optional[str] = Field(
        default="db-prod-01",
        description="Crown-jewel asset ID to assess reachability against (e.g. db-prod-01, dc-01)",
    )
    max_depth: int = Field(
        default=5,
        ge=1,
        le=8,
        description="Maximum hop traversal search horizon",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of candidate attack paths to return",
    )
    isolated_nodes: Optional[List[str]] = Field(
        default=[],
        description="Quarantined or isolated node IDs to exclude from traversal graph",
    )
    simulation_mode: bool = Field(
        default=True,
        description="Explicit flag declaring this run as defensive heuristic simulation",
    )


class RiskFactorBreakdown(BaseModel):
    vulnerability_severity: float = Field(..., description="Vulnerability density and CVSS score (0-100)")
    asset_criticality: float = Field(..., description="Target asset operational criticality score (0-100)")
    privilege_access_level: float = Field(..., description="Network permission privilege level (0-100)")
    detection_evidence_level: float = Field(..., description="Correlated Module 1 neural detection alert weight (0-100)")
    exposure_index: float = Field(..., description="Network exposure and zone perimeter ingress score (0-100)")
    path_hop_penalty: float = Field(..., description="Length penalty (shorter paths present higher immediate risk) (0-100)")


class HopDetail(BaseModel):
    hop_index: int
    from_node: str
    from_name: str
    to_node: str
    to_name: str
    protocol: str
    port: int
    relationship_type: str
    access_permissions: str
    mitre_technique_id: str
    mitre_technique_name: str
    mitre_tactic: str
    hop_risk_score: float
    estimated_traversal_time_mins: float
    detection_indicators: List[str]
    explanation: str


class CandidateAttackPath(BaseModel):
    path_id: str
    source_node: str
    target_node: str
    target_name: str
    nodes: List[str]
    node_names: List[str]
    hops: int
    risk_score: float = Field(..., description="Heuristic risk score (0-100)")
    risk_category: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW")
    risk_factors: RiskFactorBreakdown
    hop_details: List[HopDetail]
    estimated_time_mins: float
    evidence_references: List[str]
    assumptions: List[str]
    ranking_explanation: str
    containment_recommendation: Optional[str] = None


class CriticalChokepoint(BaseModel):
    node_id: str
    name: str
    frequency: int
    criticality: str
    recommended_action: str


class AttackPathPredictionResponse(BaseModel):
    prediction_id: str
    timestamp: str
    source_asset_id: str
    source_asset_name: str
    target_asset_id: Optional[str]
    target_asset_name: Optional[str]
    topology_snapshot_id: str
    total_candidate_paths: int
    candidate_paths: List[CandidateAttackPath]
    critical_chokepoints: List[CriticalChokepoint]
    scoring_engine_version: str = "OMEN-AP-2.1"
    simulation_mode: bool = True
    disclaimer: str = (
        "HEURISTIC DEFENSIVE SIMULATION: Risk scores represent synthetic traversal risk models "
        "and do NOT guarantee future adversary behavior. No real offensive attacks were executed."
    )
    data_provenance: Dict[str, Any] = Field(default_factory=dict)


class PredictionHistoryItem(BaseModel):
    prediction_id: str
    timestamp: str
    source_asset_id: str
    target_asset_id: Optional[str]
    total_paths: int
    highest_risk_score: float
    risk_category: str
    scoring_version: str
    is_simulation: bool


class CriticalAssetItem(BaseModel):
    id: str
    name: str
    zone: str
    criticality: str
    asset_type: str
    ip: Optional[str] = None
    vuln_score: float
    security_status: str


class EngineHealthResponse(BaseModel):
    status: str
    engine: str
    version: str
    algorithm: str
    topology_loaded: bool
    total_nodes: int
    total_edges: int
    graph_density: float
    scoring_model: str
