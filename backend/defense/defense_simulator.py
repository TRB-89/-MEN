"""Autonomous Defense Simulation Engine.

Simulates cyber defense interventions (e.g. zero-trust workstation isolation)
and compares graph reachability, blast radius, and critical asset exposure
before and after the simulated containment.
NOTE: This is strictly an educational simulation. No actual network interfaces
or live infrastructure are modified.
"""

from typing import Dict, List, Any, Optional
import networkx as nx
from backend.graph_engine.topology import build_network_graph, DEVICE_DATA


def simulate_isolation(
    isolated_node_ids: List[str],
    entry_node: str = "srv-web-01",
) -> Dict[str, Any]:
    """Simulate isolation of selected nodes and quantify before/after risk delta."""
    # 1. Baseline network before isolation
    G_before = build_network_graph(isolated_nodes=[])
    
    # 2. Defense network with simulated isolation
    G_after = build_network_graph(isolated_nodes=isolated_node_ids)

    # Calculate reachable assets before
    reachable_before = set()
    if entry_node in G_before:
        reachable_before = set(nx.descendants(G_before, entry_node))
        reachable_before.add(entry_node)

    # Calculate reachable assets after
    reachable_after = set()
    if entry_node in G_after and entry_node not in isolated_node_ids:
        reachable_after = set(nx.descendants(G_after, entry_node))
        reachable_after.add(entry_node)

    # Identify critical assets (Crown Jewels)
    critical_assets = {
        d["id"] for d in DEVICE_DATA if d.get("criticality") == "CRITICAL"
    }

    critical_exposed_before = reachable_before.intersection(critical_assets)
    critical_exposed_after = reachable_after.intersection(critical_assets)
    saved_critical_assets = critical_exposed_before - critical_exposed_after

    blast_radius_before = len(reachable_before)
    blast_radius_after = len(reachable_after)

    reduction = blast_radius_before - blast_radius_after
    containment_score = 0.0
    if blast_radius_before > 0:
        containment_score = round((reduction / blast_radius_before) * 100.0, 2)

    # Count severed communication edges
    edges_before = G_before.number_of_edges()
    edges_after = G_after.number_of_edges()
    severed_links = edges_before - edges_after

    return {
        "simulation_mode": "EDUCATIONAL_AUTONOMOUS_DEFENSE",
        "entry_node": entry_node,
        "entry_node_name": G_before.nodes.get(entry_node, {}).get("name", entry_node),
        "isolated_nodes": isolated_node_ids,
        "metrics": {
            "blast_radius_before": blast_radius_before,
            "blast_radius_after": blast_radius_after,
            "containment_efficacy_pct": containment_score,
            "severed_edges_count": severed_links,
            "critical_assets_saved_count": len(saved_critical_assets),
        },
        "reachability_comparison": {
            "reachable_nodes_before": list(reachable_before),
            "reachable_nodes_after": list(reachable_after),
            "critical_exposed_before": list(critical_exposed_before),
            "critical_exposed_after": list(critical_exposed_after),
            "protected_crown_jewels": list(saved_critical_assets),
        },
        "summary": (
            f"Simulated isolation of {isolated_node_ids} reduced attacker blast radius "
            f"from {blast_radius_before} to {blast_radius_after} reachable devices "
            f"({containment_score}% containment efficacy). "
            f"{len(saved_critical_assets)} critical assets were successfully shielded."
        ),
    }


def recommend_defensive_actions(entry_node: str = "srv-web-01") -> List[Dict[str, Any]]:
    """Generate prioritized containment recommendations by testing single-node isolations."""
    candidates = [
        d["id"]
        for d in DEVICE_DATA
        if d["id"] != entry_node and d["device_type"] in ("workstation", "server", "switch")
    ]

    recommendations = []
    for cand in candidates:
        sim = simulate_isolation([cand], entry_node=entry_node)
        efficacy = sim["metrics"]["containment_efficacy_pct"]
        saved = sim["metrics"]["critical_assets_saved_count"]

        if efficacy > 0:
            recommendations.append({
                "recommended_isolation_target": cand,
                "target_name": DEVICE_DATA[[d['id'] for d in DEVICE_DATA].index(cand)]["name"],
                "target_zone": DEVICE_DATA[[d['id'] for d in DEVICE_DATA].index(cand)]["zone"],
                "projected_containment_pct": efficacy,
                "critical_assets_shielded": saved,
                "confidence_score": round(min(0.98, 0.60 + (efficacy / 200.0)), 2),
                "rationale": (
                    f"Isolating {cand} cuts key lateral pathways from {entry_node}, "
                    f"yielding a {efficacy}% blast-radius reduction."
                ),
            })

    # Sort descending by projected containment percentage
    recommendations.sort(key=lambda x: (x["critical_assets_shielded"], x["projected_containment_pct"]), reverse=True)
    return recommendations[:5]
