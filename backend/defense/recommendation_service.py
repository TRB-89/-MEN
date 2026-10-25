"""Orchestration Service for Module 4: Autonomous Defense Simulation.

Integrates upstream Module 1 detections, Module 2 topology, and Module 3 predictions
to simulate, rank, and persist defensive containment strategies.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from backend.database.db import (
    AttackPathPredictionRecord,
    DefenseSimulationRecord,
    DefenseApprovalRecord,
    NetworkAssetRecord,
)
from backend.defense.schemas import (
    DefenseRecommendationRequest,
    DefenseRecommendationResponse,
    DefenseSimulationRequest,
    DefenseSimulationResponse,
    DefenseApprovalRequest,
    DefenseApprovalResponse,
)
from backend.defense.action_catalog import generate_candidate_actions
from backend.defense.decision_engine import rank_defensive_strategies
from backend.defense.simulation_engine import run_defense_simulation
from backend.path_prediction.graph_loader import load_prediction_graph
from backend.path_prediction.path_finder import find_candidate_paths


def generate_defense_recommendations(
    request: DefenseRecommendationRequest,
    db: Optional[Session] = None,
) -> DefenseRecommendationResponse:
    """Generate and rank multi-objective defensive containment recommendations."""
    entry_node = request.entry_node or "srv-web-01"
    target_node = request.target_asset_id or "db-prod-01"
    attack_paths: List[List[str]] = []
    snapshot_id = "SNAP-DEFAULT"

    # 1. Retrieve Module 3 Attack Path Prediction if prediction_id provided
    if request.prediction_id and db is not None:
        try:
            pred_record = (
                db.query(AttackPathPredictionRecord)
                .filter(AttackPathPredictionRecord.id == request.prediction_id)
                .first()
            )
            if pred_record:
                entry_node = pred_record.source_asset_id
                target_node = pred_record.target_asset_id or target_node
                snapshot_id = pred_record.topology_snapshot or snapshot_id
                paths_data = json.loads(pred_record.paths_json or "[]")
                attack_paths = [p.get("nodes", []) for p in paths_data if "nodes" in p]
        except Exception:
            pass

    # 2. If no prediction paths loaded, compute dynamically from topology
    G, dynamic_snap = load_prediction_graph(db=db)
    if not snapshot_id or snapshot_id == "SNAP-DEFAULT":
        snapshot_id = dynamic_snap

    if not attack_paths:
        attack_paths = find_candidate_paths(
            G=G,
            source_node=entry_node,
            target_node=target_node,
            max_depth=5,
            top_k=5,
        )

    # 3. Generate candidate actions across all 4 defense archetypes
    candidate_actions = generate_candidate_actions(
        G=G,
        attack_paths=attack_paths,
        entry_node=entry_node,
    )

    # 4. Rank candidate strategies via Decision Engine
    top_recommended, alternatives = rank_defensive_strategies(
        candidate_actions=candidate_actions,
        entry_node=entry_node,
        target_asset_id=target_node,
        prediction_id=request.prediction_id,
        risk_weight=request.risk_weight,
        disruption_weight=request.disruption_weight,
        max_recommendations=request.max_recommendations,
        db=db,
    )

    rec_id = f"REC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    summary = (
        f"Autonomous defense simulation evaluated {len(candidate_actions)} candidate containment actions. "
        f"Top strategy recommends {top_recommended.action_type.replace('_', ' ')} targeting '{top_recommended.target_name}', "
        f"achieving {top_recommended.projected_risk_reduction_pct:.1f}% risk mitigation with "
        f"{top_recommended.operational_disruption_pct:.1f}% collateral disruption cost."
    )

    return DefenseRecommendationResponse(
        recommendation_id=rec_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        entry_node=entry_node,
        crown_jewel_target=target_node,
        prediction_id=request.prediction_id,
        topology_snapshot_id=snapshot_id,
        recommended_strategy=top_recommended,
        alternative_strategies=alternatives,
        scoring_weights={
            "risk_weight": request.risk_weight,
            "disruption_weight": request.disruption_weight,
        },
        summary=summary,
        disclaimer=(
            "DEFENSIVE SIMULATION ADVISORY: Recommendations represent heuristic containment models. "
            "No automated changes were executed against production networks or endpoints."
        ),
    )


def execute_defense_simulation_and_persist(
    request: DefenseSimulationRequest,
    db: Optional[Session] = None,
) -> DefenseSimulationResponse:
    """Execute an isolated simulation run and persist results to SQLite."""
    sim_result = run_defense_simulation(
        action_type=request.action_type,
        target_entity=request.target_entity,
        entry_node=request.entry_node,
        target_asset_id=request.target_asset_id,
        prediction_id=request.prediction_id,
        max_hops=request.max_hops,
        db=db,
    )

    # Persist in SQLite
    if db is not None:
        try:
            record = DefenseSimulationRecord(
                id=sim_result.simulation_id,
                prediction_id=request.prediction_id,
                topology_snapshot=sim_result.topology_snapshot_id,
                action_type=sim_result.action_type,
                target_entity=sim_result.target_entity,
                risk_before=sim_result.metrics.risk_score_before,
                risk_after=sim_result.metrics.risk_score_after,
                risk_reduction_pct=sim_result.metrics.risk_reduction_pct,
                disruption_score=sim_result.metrics.operational_disruption_score,
                containment_efficacy=sim_result.metrics.containment_efficacy_pct,
                approval_status="PENDING",
                details_json=json.dumps(sim_result.model_dump()),
                created_at=datetime.now(timezone.utc),
            )
            db.add(record)
            db.commit()
        except Exception:
            db.rollback()

    return sim_result


def record_defense_approval(
    request: DefenseApprovalRequest,
    db: Session,
) -> DefenseApprovalResponse:
    """Record human SecOps analyst approval or rejection of a simulation plan."""
    sim_record = (
        db.query(DefenseSimulationRecord)
        .filter(DefenseSimulationRecord.id == request.simulation_id)
        .first()
    )
    if sim_record:
        sim_record.approval_status = request.decision.upper()

    approval_id = f"APP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    app_record = DefenseApprovalRecord(
        id=approval_id,
        simulation_id=request.simulation_id,
        analyst_id=request.analyst_id,
        decision=request.decision.upper(),
        notes=request.notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(app_record)
    db.commit()

    return DefenseApprovalResponse(
        approval_id=approval_id,
        simulation_id=request.simulation_id,
        analyst_id=request.analyst_id,
        decision=request.decision.upper(),
        notes=request.notes,
        approved_at=datetime.now(timezone.utc).isoformat(),
        audit_message=(
            f"SecOps analyst '{request.analyst_id}' recorded decision '{request.decision.upper()}' "
            f"for simulation plan {request.simulation_id}. Safety policy enforced: zero production mutations."
        ),
    )
