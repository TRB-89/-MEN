"""ØMEN Module 4: Autonomous Defense Simulation Engine."""

from backend.defense.schemas import (
    DefenseActionType,
    DefenseActionDefinition,
    DefenseSimulationRequest,
    DefenseSimulationResponse,
    DefenseRecommendationRequest,
    DefenseRecommendationResponse,
    DefenseRecommendationItem,
    DefenseApprovalRequest,
    DefenseApprovalResponse,
    DefenseHistoryItem,
    DefenseEngineHealth,
    SimulationMetrics,
    BusinessImpactAnalysis,
)
from backend.defense.action_catalog import generate_candidate_actions
from backend.defense.impact_analysis import analyze_business_impact
from backend.defense.simulation_engine import run_defense_simulation
from backend.defense.decision_engine import rank_defensive_strategies
from backend.defense.recommendation_service import (
    generate_defense_recommendations,
    execute_defense_simulation_and_persist,
    record_defense_approval,
)

__all__ = [
    "DefenseActionType",
    "DefenseActionDefinition",
    "DefenseSimulationRequest",
    "DefenseSimulationResponse",
    "DefenseRecommendationRequest",
    "DefenseRecommendationResponse",
    "DefenseRecommendationItem",
    "DefenseApprovalRequest",
    "DefenseApprovalResponse",
    "DefenseHistoryItem",
    "DefenseEngineHealth",
    "SimulationMetrics",
    "BusinessImpactAnalysis",
    "generate_candidate_actions",
    "analyze_business_impact",
    "run_defense_simulation",
    "rank_defensive_strategies",
    "generate_defense_recommendations",
    "execute_defense_simulation_and_persist",
    "record_defense_approval",
]
