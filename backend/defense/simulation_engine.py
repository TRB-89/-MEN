"""Isolated Graph Simulation Engine for Autonomous Cyber Defense.

Clones the authoritative network graph, applies simulated defensive interventions,
recomputes candidate attack corridors with Module 3 algorithms, and evaluates before/after risk.
"""

from typing import Dict, List, Any, Tuple, Optional
import copy
import networkx as nx

from backend.defense.schemas import (
    DefenseActionType,
    SimulationMetrics,
    DefenseSimulationResponse,
)
from backend.defense.impact_analysis import analyze_business_impact
from backend.path_prediction.graph_loader import load_prediction_graph
from backend.path_prediction.path_finder import find_candidate_paths
from backend.path_prediction.risk_engine import evaluate_path_risk


def run_defense_simulation(
    action_type: str,
    target_entity: str,
    entry_node: str = "srv-web-01",
    target_asset_id: Optional[str] = "db-prod-01",
    prediction_id: Optional[str] = None,
    max_hops: int = 5,
    db: Optional[Any] = None,
) -> DefenseSimulationResponse:
    """Execute an isolated before-and-after defensive simulation.

    Ensures baseline graph is never mutated. All operations occur on deep-copied graphs.
    """
    # 1. Load baseline graph
    G_baseline, snapshot_id = load_prediction_graph(db=db)

    # 2. Compute BEFORE state
    paths_before_raw = find_candidate_paths(
        G=G_baseline,
        source_node=entry_node,
        target_node=target_asset_id,
        max_depth=max_hops,
        top_k=10,
    )

    risk_scores_before = []
    for p in paths_before_raw:
        r_score, _, _, _, _, _ = evaluate_path_risk(p, G_baseline, [])
        risk_scores_before.append(r_score)

    highest_risk_before = max(risk_scores_before) if risk_scores_before else 0.0

    # Reachable nodes before
    reachable_before = set()
    if entry_node in G_baseline:
        try:
            reachable_before = set(nx.descendants(G_baseline, entry_node))
            reachable_before.add(entry_node)
        except Exception:
            reachable_before = {entry_node}

    critical_nodes = {n for n, d in G_baseline.nodes(data=True) if d.get("criticality") == "CRITICAL"}
    critical_exposed_before = reachable_before.intersection(critical_nodes)

    # 3. Create deep-copied simulation graph and apply action
    G_sim = copy.deepcopy(G_baseline)
    severed_edges = 0
    target_name = target_entity

    if action_type == DefenseActionType.WORKSTATION_ISOLATION:
        node_id = target_entity
        if node_id in G_sim:
            target_name = G_sim.nodes[node_id].get("name", node_id)
            # Remove all in/out edges
            in_edges = list(G_sim.in_edges(node_id))
            out_edges = list(G_sim.out_edges(node_id))
            severed_edges = len(in_edges) + len(out_edges)
            G_sim.remove_node(node_id)

    elif action_type in (DefenseActionType.CONNECTION_RESTRICTION, DefenseActionType.SESSION_REVOCATION):
        if "->" in target_entity:
            u, v = target_entity.split("->", 1)
            if G_sim.has_edge(u, v):
                u_name = G_sim.nodes.get(u, {}).get("name", u)
                v_name = G_sim.nodes.get(v, {}).get("name", v)
                target_name = f"{u_name} → {v_name}"
                G_sim.remove_edge(u, v)
                severed_edges = 1

    elif action_type == DefenseActionType.ENHANCED_MONITORING:
        node_id = target_entity
        if node_id in G_sim:
            target_name = G_sim.nodes[node_id].get("name", node_id)
            # Monitoring increases visibility without severing communication
            G_sim.nodes[node_id]["monitored"] = True
            severed_edges = 0

    # 4. Compute AFTER state
    paths_after_raw = []
    if entry_node in G_sim:
        paths_after_raw = find_candidate_paths(
            G=G_sim,
            source_node=entry_node,
            target_node=target_asset_id,
            max_depth=max_hops,
            top_k=10,
        )

    risk_scores_after = []
    remaining_paths_details = []
    for p in paths_after_raw:
        r_score, cat, factors, est_time, _, expl = evaluate_path_risk(p, G_sim, [])
        risk_scores_after.append(r_score)
        remaining_paths_details.append({
            "nodes": p,
            "hops": len(p) - 1,
            "risk_score": r_score,
            "risk_category": cat,
            "estimated_time_mins": est_time,
            "explanation": expl,
        })

    # For enhanced monitoring, model a 35% residual risk reduction due to active honeypot detection
    if action_type == DefenseActionType.ENHANCED_MONITORING:
        highest_risk_after = round(highest_risk_before * 0.65, 1)
    else:
        highest_risk_after = max(risk_scores_after) if risk_scores_after else 0.0

    # Reachable nodes after
    reachable_after = set()
    if entry_node in G_sim:
        try:
            reachable_after = set(nx.descendants(G_sim, entry_node))
            reachable_after.add(entry_node)
        except Exception:
            reachable_after = {entry_node}

    critical_exposed_after = reachable_after.intersection(critical_nodes)
    saved_critical = critical_exposed_before - critical_exposed_after

    blast_before = len(reachable_before)
    blast_after = len(reachable_after)
    containment_efficacy = 0.0
    if blast_before > 0:
        containment_efficacy = round(((blast_before - blast_after) / blast_before) * 100.0, 1)

    # Risk reduction percentage
    risk_reduction_pct = 0.0
    if highest_risk_before > 0:
        risk_reduction_pct = round(((highest_risk_before - highest_risk_after) / highest_risk_before) * 100.0, 1)

    # Interrupted paths
    paths_before_sig = {"->".join(p) for p in paths_before_raw}
    paths_after_sig = {"->".join(p) for p in paths_after_raw}
    interrupted_signatures = list(paths_before_sig - paths_after_sig)

    # 5. Analyze business impact
    business_impact = analyze_business_impact(
        action_type=action_type,
        target_entity=target_entity,
        G_before=G_baseline,
        G_after=G_sim,
    )

    # Operational disruption score (0 to 100)
    disruption_cost = min(95.0, business_impact.estimated_downtime_minutes * 0.5)

    # Net defensive utility = 0.7 * risk_reduction - 0.3 * disruption_cost
    net_utility = round(max(0.0, 0.7 * risk_reduction_pct - 0.3 * disruption_cost), 1)

    metrics = SimulationMetrics(
        blast_radius_before=blast_before,
        blast_radius_after=blast_after,
        containment_efficacy_pct=containment_efficacy,
        severed_edges_count=severed_edges,
        critical_assets_saved_count=len(saved_critical),
        residual_critical_exposed_count=len(critical_exposed_after),
        risk_score_before=highest_risk_before,
        risk_score_after=highest_risk_after,
        risk_reduction_pct=risk_reduction_pct,
        operational_disruption_score=round(disruption_cost, 1),
        net_defensive_utility=net_utility,
    )

    # 6. Synthesize explanation
    import uuid
    from datetime import datetime, timezone

    sim_id = f"SIM-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    explanation = (
        f"Simulated {action_type.replace('_', ' ')} targeting '{target_name}'. "
        f"Interrupted {len(interrupted_signatures)} potential attack paths, reducing overall risk "
        f"from {highest_risk_before:.1f} to {highest_risk_after:.1f} ({risk_reduction_pct}% reduction). "
        f"Collateral business disruption: {business_impact.operational_friction} ({business_impact.estimated_downtime_minutes} mins est. friction)."
    )

    assumptions = [
        f"Simulation evaluated on isolated snapshot '{snapshot_id}'.",
        "Baseline production network is unmodified and fully protected.",
        "Attacker lateral traversal attempts are assumed blocked at the containment perimeter.",
    ]

    return DefenseSimulationResponse(
        simulation_id=sim_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        action_type=action_type,
        target_entity=target_entity,
        target_name=target_name,
        entry_node=entry_node,
        entry_node_name=G_baseline.nodes.get(entry_node, {}).get("name", entry_node),
        crown_jewel_target=target_asset_id,
        topology_snapshot_id=snapshot_id,
        prediction_id=prediction_id,
        metrics=metrics,
        business_impact=business_impact,
        reachability_comparison={
            "reachable_nodes_before": list(reachable_before),
            "reachable_nodes_after": list(reachable_after),
            "critical_exposed_before": list(critical_exposed_before),
            "critical_exposed_after": list(critical_exposed_after),
            "protected_crown_jewels": list(saved_critical),
        },
        interrupted_attack_paths=interrupted_signatures,
        remaining_attack_paths=remaining_paths_details,
        explanation=explanation,
        assumptions=assumptions,
        approval_status="PENDING",
    )
