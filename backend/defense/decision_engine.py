"""Multi-Objective Defense Decision and Ranking Engine.

Evaluates candidate defensive strategies against multi-objective criteria,
balancing risk reduction against collateral operational disruption.
"""

from typing import List, Dict, Any, Tuple, Optional
import networkx as nx

from backend.defense.schemas import (
    DefenseRecommendationItem,
    DefenseActionDefinition,
)
from backend.defense.simulation_engine import run_defense_simulation


def rank_defensive_strategies(
    candidate_actions: List[DefenseActionDefinition],
    entry_node: str,
    target_asset_id: str,
    prediction_id: Optional[str] = None,
    risk_weight: float = 0.7,
    disruption_weight: float = 0.3,
    max_recommendations: int = 5,
    db: Optional[Any] = None,
) -> Tuple[DefenseRecommendationItem, List[DefenseRecommendationItem]]:
    """Simulate and rank candidate actions according to multi-objective defensive utility.

    Returns:
        Tuple of (top_recommended_strategy, alternative_strategies)
    """
    evaluated_items: List[DefenseRecommendationItem] = []

    for idx, act in enumerate(candidate_actions):
        sim = run_defense_simulation(
            action_type=act.action_type,
            target_entity=act.target_entity,
            entry_node=entry_node,
            target_asset_id=target_asset_id,
            prediction_id=prediction_id,
            db=db,
        )

        risk_red = sim.metrics.risk_reduction_pct
        disrupt = sim.metrics.operational_disruption_score
        saved_crit = sim.metrics.critical_assets_saved_count
        interrupted_count = len(sim.interrupted_attack_paths)

        # Multi-objective utility formula
        utility = (risk_weight * risk_red) - (disruption_weight * disrupt)
        utility = round(max(0.0, utility), 1)

        # Confidence: high risk reduction with low disruption yields higher confidence
        confidence = round(min(0.98, max(0.50, 0.50 + (risk_red / 200.0) - (disrupt / 400.0))), 2)

        tradeoff = (
            f"Yields {risk_red:.1f}% risk mitigation while incurring "
            f"{disrupt:.1f}/100 collateral operational friction ({sim.business_impact.operational_friction})."
        )

        rec_item = DefenseRecommendationItem(
            recommendation_id=f"REC-{idx + 1:02d}",
            rank=0,  # Will be assigned after sorting
            action_type=act.action_type,
            target_entity=act.target_entity,
            target_name=act.target_name,
            target_zone=act.target_zone or "Corporate",
            projected_risk_reduction_pct=risk_red,
            operational_disruption_pct=round(disrupt, 1),
            net_utility_score=utility,
            confidence_score=confidence,
            rationale=sim.explanation,
            affected_paths_count=interrupted_count,
            critical_assets_shielded=saved_crit,
            decision_tradeoff=tradeoff,
        )
        evaluated_items.append(rec_item)

    # Sort descending by net utility score, then risk reduction
    evaluated_items.sort(key=lambda x: (x.net_utility_score, x.projected_risk_reduction_pct), reverse=True)

    # Assign sequential ranks
    for r_idx, item in enumerate(evaluated_items):
        item.rank = r_idx + 1

    top_recommended = evaluated_items[0] if evaluated_items else _default_fallback_recommendation()
    alternatives = evaluated_items[1:max_recommendations]

    return top_recommended, alternatives


def _default_fallback_recommendation() -> DefenseRecommendationItem:
    return DefenseRecommendationItem(
        recommendation_id="REC-01",
        rank=1,
        action_type="ENHANCED_MONITORING",
        target_entity="sw-core-01",
        target_name="Core Layer-3 Switch",
        target_zone="Core",
        projected_risk_reduction_pct=35.0,
        operational_disruption_pct=0.0,
        net_utility_score=24.5,
        confidence_score=0.85,
        rationale="Deploy aggressive telemetry monitoring across core switch.",
        affected_paths_count=0,
        critical_assets_shielded=0,
        decision_tradeoff="Zero operational disruption.",
    )
