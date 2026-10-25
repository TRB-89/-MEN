"""Orchestration service for Module 3: Attack Path Prediction Engine.

Integrates Module 1 neural detection telemetry, Module 2 network topology,
heuristic risk evaluation, MITRE ATT&CK mapping, and SQLite persistence.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from backend.database.db import (
    AttackPathPredictionRecord,
    DetectionRecord,
    NetworkAlertRecord,
    NetworkAssetRecord,
)
from backend.path_prediction.schemas import (
    AttackPathPredictionRequest,
    AttackPathPredictionResponse,
    CandidateAttackPath,
    CriticalChokepoint,
)
from backend.path_prediction.graph_loader import load_prediction_graph
from backend.path_prediction.path_finder import find_candidate_paths
from backend.path_prediction.risk_engine import evaluate_path_risk
from backend.path_prediction.explanation_engine import (
    build_hop_explanations,
    extract_chokepoints,
)


def execute_attack_path_prediction(
    request: AttackPathPredictionRequest,
    db: Optional[Session] = None,
) -> AttackPathPredictionResponse:
    """Execute complete attack path discovery, risk ranking, explanation, and persistence."""
    # 1. Load topology graph with isolated nodes filtered out
    G, snapshot_id = load_prediction_graph(db, request.isolated_nodes)

    source_id = request.source_asset_id
    target_id = request.target_asset_id

    # Validate source node presence
    if source_id not in G:
        source_name = source_id
        if db is not None:
            asset = db.query(NetworkAssetRecord).filter(NetworkAssetRecord.id == source_id).first()
            if asset:
                source_name = asset.name
        return AttackPathPredictionResponse(
            prediction_id=f"PRED-{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            source_asset_id=source_id,
            source_asset_name=source_name,
            target_asset_id=target_id,
            target_asset_name=G.nodes[target_id].get("name", target_id) if target_id in G else target_id,
            topology_snapshot_id=snapshot_id,
            total_candidate_paths=0,
            candidate_paths=[],
            critical_chokepoints=[],
            simulation_mode=request.simulation_mode,
            disclaimer="Source asset is currently isolated, offline, or does not exist in the active topology.",
            data_provenance={"error": f"Source asset '{source_id}' is not in active graph."},
        )

    # 2. Correlate Module 1 Neural Threat Detection Evidence
    evidence_records: List[Dict[str, Any]] = []
    if db is not None:
        try:
            # Query recent alerts correlated to network assets
            alerts = (
                db.query(NetworkAlertRecord)
                .order_by(NetworkAlertRecord.timestamp.desc())
                .limit(20)
                .all()
            )
            evidence_records.extend([a.to_dict() for a in alerts])

            # Query recent detection records
            detections = (
                db.query(DetectionRecord)
                .filter(DetectionRecord.threat_status.in_(["MALICIOUS", "SUSPICIOUS"]))
                .order_by(DetectionRecord.processing_timestamp.desc())
                .limit(10)
                .all()
            )
            evidence_records.extend([d.to_dict() for d in detections])
        except Exception:
            evidence_records = []

    # 3. Discover Candidate Paths using bounded NetworkX graph search
    raw_paths = find_candidate_paths(
        G=G,
        source_node=source_id,
        target_node=target_id,
        max_depth=request.max_depth,
        top_k=request.top_k,
    )

    # 4. Evaluate risk, hop explanations, and narrative for each path
    candidate_paths: List[CandidateAttackPath] = []
    for idx, p in enumerate(raw_paths):
        risk_score, category, factors, est_time, assumptions, explanation = evaluate_path_risk(
            path=p,
            G=G,
            detection_evidence=evidence_records,
        )

        hop_details = build_hop_explanations(
            path=p,
            G=G,
            detection_evidence=evidence_records,
        )

        # Evidence references matching this specific path
        path_set = set(p)
        matched_evidence = [
            f"{ev.get('threat_status')} alert on {ev.get('device_id') or ev.get('asset_id')}: {ev.get('detected_attack_cat') or ev.get('attack_category')}"
            for ev in evidence_records
            if (ev.get("device_id") in path_set or ev.get("asset_id") in path_set)
        ]

        target_node_id = p[-1]
        target_node_name = G.nodes[target_node_id].get("name", target_node_id)

        # Primary containment recommendation
        containment = None
        if len(p) > 2:
            chokepoint_node = p[1]
            containment = f"Quarantine intermediate bridge '{G.nodes[chokepoint_node].get('name', chokepoint_node)}' ({chokepoint_node}) to sever this trajectory."

        candidate_paths.append(
            CandidateAttackPath(
                path_id=f"AP-{p[0][:3].upper()}-{target_node_id[:3].upper()}-{idx + 1:02d}",
                source_node=p[0],
                target_node=target_node_id,
                target_name=target_node_name,
                nodes=p,
                node_names=[G.nodes[n].get("name", n) for n in p],
                hops=len(p) - 1,
                risk_score=risk_score,
                risk_category=category,
                risk_factors=factors,
                hop_details=hop_details,
                estimated_time_mins=est_time,
                evidence_references=matched_evidence[:4],
                assumptions=assumptions,
                ranking_explanation=explanation,
                containment_recommendation=containment,
            )
        )

    # Sort descending by risk score
    candidate_paths.sort(key=lambda x: x.risk_score, reverse=True)
    top_candidates = candidate_paths[: request.top_k]

    # 5. Extract critical chokepoints
    chokepoints = extract_chokepoints([c.nodes for c in top_candidates], G)

    prediction_id = f"PRED-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    highest_risk = top_candidates[0].risk_score if top_candidates else 0.0
    highest_category = top_candidates[0].risk_category if top_candidates else "LOW"

    response = AttackPathPredictionResponse(
        prediction_id=prediction_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source_asset_id=source_id,
        source_asset_name=G.nodes[source_id].get("name", source_id),
        target_asset_id=target_id,
        target_asset_name=G.nodes[target_id].get("name", target_id) if target_id and target_id in G else None,
        topology_snapshot_id=snapshot_id,
        total_candidate_paths=len(candidate_paths),
        candidate_paths=top_candidates,
        critical_chokepoints=chokepoints,
        scoring_engine_version="OMEN-AP-2.1",
        simulation_mode=request.simulation_mode,
        data_provenance={
            "graph_nodes_evaluated": len(G.nodes),
            "graph_edges_evaluated": len(G.edges),
            "evidence_signals_correlated": len(evidence_records),
            "max_search_depth": request.max_depth,
            "isolated_nodes_filtered": list(request.isolated_nodes or []),
        },
    )

    # 6. Persist to SQLite Incident Memory
    if db is not None:
        try:
            db_record = AttackPathPredictionRecord(
                id=prediction_id,
                source_asset_id=source_id,
                target_asset_id=target_id,
                topology_snapshot=snapshot_id,
                total_paths=len(top_candidates),
                highest_risk_score=highest_risk,
                risk_category=highest_category,
                paths_json=json.dumps([c.model_dump() for c in top_candidates]),
                chokepoints_json=json.dumps([c.model_dump() for c in chokepoints]),
                scoring_version="OMEN-AP-2.1",
                is_simulation=1 if request.simulation_mode else 0,
                metadata_json=json.dumps(response.data_provenance),
                created_at=datetime.now(timezone.utc),
            )
            db.add(db_record)
            db.commit()
        except Exception as persist_err:
            db.rollback()

    return response
