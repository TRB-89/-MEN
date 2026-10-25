"""Graph-based Attack Path Prediction and Heuristic Risk Ranking Engine.

Discovers reachable attack vectors from entry nodes to high-value assets,
calculates heuristic path risk scores, and identifies critical defensive chokepoints.
"""

from typing import Dict, List, Any, Optional
import networkx as nx
from backend.graph_engine.topology import build_network_graph, DEVICE_DATA

CRITICALITY_WEIGHTS = {
    "CRITICAL": 1.0,
    "HIGH": 0.75,
    "MEDIUM": 0.50,
    "LOW": 0.25,
}

MITRE_TECHNIQUE_RULES = {
    ("gw-ext-01", "fw-dmz-01"): "T1190 - Exploit External Interface",
    ("fw-dmz-01", "srv-web-01"): "T1190 - Ingress Web Exploitation",
    ("fw-dmz-01", "srv-proxy-01"): "T1071.001 - Web Protocols Ingress",
    ("srv-web-01", "sw-core-01"): "T1046 - Network Service Scanning",
    ("srv-web-01", "ws-dev-04"): "T1021.004 - SSH Lateral Tunneling",
    ("ws-dev-04", "sw-core-01"): "T1021.002 - SMB Network Infiltration",
    ("ws-dev-04", "ws-ops-05"): "T1021.002 - SMB Lateral Relay",
    ("ws-dev-04", "ws-admin-01"): "T1078.002 - Domain Accounts Escalation",
    ("ws-ops-05", "ws-fin-03"): "T1021.001 - Remote Desktop Protocol",
    ("ws-admin-01", "dc-01"): "T1003.003 - NTDS.dit / Credential Dumping",
    ("ws-admin-01", "db-prod-01"): "T1078 - Privileged DBA Access",
    ("sw-core-01", "dc-01"): "T1558.003 - Kerberoasting Ticket Probe",
    ("sw-core-01", "db-prod-01"): "T1190 - Direct Database Port Ingress",
    ("dc-01", "db-prod-01"): "T1078 - Golden Ticket Authentication",
    ("db-prod-01", "srv-backup-01"): "T1486 - Data Encrypted / Exfiltration",
}


def find_attack_paths(
    source_node: str = "srv-web-01",
    target_node: Optional[str] = None,
    isolated_nodes: Optional[List[str]] = None,
    max_hops: int = 5,
) -> Dict[str, Any]:
    """Discover and rank attack paths from source to target high-value assets."""
    G = build_network_graph(isolated_nodes)

    if source_node not in G:
        return {"error": f"Source node '{source_node}' not found in network topology."}

    # If no specific target provided, target all CRITICAL assets
    target_candidates = (
        [target_node]
        if target_node
        else [n for n, d in G.nodes(data=True) if d.get("criticality") == "CRITICAL" and n != source_node]
    )

    discovered_paths = []
    chokepoint_counter: Dict[str, int] = {}

    for tgt in target_candidates:
        if tgt not in G or tgt == source_node:
            continue

        try:
            # Enumerate simple paths up to max_hops
            paths = list(nx.all_simple_paths(G, source=source_node, target=tgt, cutoff=max_hops))
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            paths = []

        for p in paths:
            risk_score, time_est, hop_details = _evaluate_path(p, G)
            path_record = {
                "path_id": f"AP-{''.join([node.split('-')[0][:2] for node in p])}-{len(discovered_paths) + 1}",
                "target_node": tgt,
                "target_name": G.nodes[tgt].get("name", tgt),
                "nodes": p,
                "hops": len(p) - 1,
                "risk_score": round(risk_score, 2),
                "estimated_time_mins": round(time_est, 1),
                "hop_details": hop_details,
            }
            discovered_paths.append(path_record)

            # Accumulate intermediate nodes as potential defensive chokepoints
            for intermediate in p[1:-1]:
                chokepoint_counter[intermediate] = chokepoint_counter.get(intermediate, 0) + 1

    # Sort paths descending by risk score
    discovered_paths.sort(key=lambda x: x["risk_score"], reverse=True)

    # Rank chokepoints by occurrence frequency in identified attack paths
    ranked_chokepoints = sorted(
        [
            {
                "node_id": nid,
                "name": G.nodes[nid].get("name", nid),
                "frequency": count,
                "criticality": G.nodes[nid].get("criticality", "UNKNOWN"),
            }
            for nid, count in chokepoint_counter.items()
        ],
        key=lambda x: x["frequency"],
        reverse=True,
    )

    return {
        "source_node": source_node,
        "source_name": G.nodes[source_node].get("name", source_node),
        "total_paths_discovered": len(discovered_paths),
        "isolated_nodes_active": list(isolated_nodes or []),
        "paths": discovered_paths[:10],  # Return top 10 ranked paths
        "critical_chokepoints": ranked_chokepoints[:5],
    }


def _evaluate_path(path: List[str], G: nx.DiGraph):
    """Calculate heuristic risk score and estimated time-to-compromise for an attack path."""
    hop_details = []
    cumulative_risk = 0.0
    estimated_time = 0.0

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge_data = G.get_edge_data(u, v) or {}
        v_data = G.nodes[v]

        vuln_score = v_data.get("vuln_score", 0.5)
        crit_weight = CRITICALITY_WEIGHTS.get(v_data.get("criticality", "MEDIUM"), 0.5)
        edge_weight = edge_data.get("weight", 1.0)
        protocol = edge_data.get("protocol", "TCP")

        mitre = MITRE_TECHNIQUE_RULES.get(
            (u, v), f"T1021 - Lateral Movement via {protocol}"
        )

        # Hop risk formula: vulnerability density * target asset criticality / friction weight
        hop_risk = (vuln_score * 40.0 * crit_weight) / max(0.5, edge_weight)
        cumulative_risk += hop_risk

        # Estimated time: higher friction takes longer
        hop_time = max(5.0, edge_weight * 12.0 * (1.1 - vuln_score))
        estimated_time += hop_time

        hop_details.append({
            "from_node": u,
            "to_node": v,
            "protocol": protocol,
            "port": edge_data.get("port"),
            "mitre_technique": mitre,
            "hop_risk": round(hop_risk, 2),
            "estimated_time_mins": round(hop_time, 1),
        })

    # Normalize overall path risk to 0-100 scale
    final_risk = min(100.0, max(10.0, cumulative_risk))

    return final_risk, estimated_time, hop_details
