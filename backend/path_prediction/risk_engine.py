"""Transparent heuristic risk scoring engine for candidate attack paths.

Calculates multi-dimensional risk factor breakdowns and normalized path risk scores (0-100),
incorporating target criticality, intermediate vulnerability densities, network privilege,
Module 1 neural detection alerts, and traversal depth penalties.
"""

from typing import Dict, List, Any, Tuple
import networkx as nx
from backend.path_prediction.schemas import RiskFactorBreakdown

CRITICALITY_SCORES = {
    "CRITICAL": 100.0,
    "HIGH": 75.0,
    "MEDIUM": 50.0,
    "LOW": 25.0,
}

ZONE_EXPOSURE_SCORES = {
    "Perimeter": 95.0,
    "DMZ": 85.0,
    "Corporate": 60.0,
    "Core": 45.0,
    "Restricted": 20.0,
}


def evaluate_path_risk(
    path: List[str],
    G: nx.DiGraph,
    detection_evidence: List[Dict[str, Any]],
) -> Tuple[float, str, RiskFactorBreakdown, float, List[str], str]:
    """Calculate normalized risk score, risk factors, estimated traversal time, assumptions, and explanation.

    Returns:
        Tuple of (risk_score, risk_category, risk_factors, estimated_time_mins, assumptions, ranking_explanation)
    """
    hops = len(path) - 1
    if hops == 0:
        return 0.0, "LOW", RiskFactorBreakdown(
            vulnerability_severity=0.0,
            asset_criticality=0.0,
            privilege_access_level=0.0,
            detection_evidence_level=0.0,
            exposure_index=0.0,
            path_hop_penalty=0.0,
        ), 0.0, ["Source and destination are identical."], "No lateral movement required."

    target_node = path[-1]
    target_data = G.nodes[target_node]
    source_node = path[0]
    source_data = G.nodes[source_node]

    # 1. Target Asset Criticality (0-100)
    target_crit_score = CRITICALITY_SCORES.get(target_data.get("criticality", "MEDIUM"), 50.0)

    # 2. Cumulative Vulnerability Severity across traversed nodes (0-100)
    # Average and maximum vulnerability across the path
    vuln_scores = [float(G.nodes[n].get("vuln_score", 0.3)) * 100.0 for n in path]
    avg_vuln = sum(vuln_scores) / len(vuln_scores)
    max_vuln = max(vuln_scores)
    vulnerability_factor = round(0.6 * avg_vuln + 0.4 * max_vuln, 2)

    # 3. Access Privilege Level across relationships (0-100)
    # Evaluates whether edges require administrative, privileged, or default network access
    privilege_scores = []
    for i in range(hops):
        u, v = path[i], path[i + 1]
        edge = G.get_edge_data(u, v) or {}
        perms = (edge.get("access_permissions") or "").upper()
        rel_type = (edge.get("relationship_type") or "").upper()
        port = edge.get("port", 0)

        if "AUTHENTICATES_TO" in rel_type or "MANAGES" in rel_type or port in (88, 389, 445):
            privilege_scores.append(90.0)
        elif port in (22, 3389, 1433, 5432):
            privilege_scores.append(75.0)
        elif "ALLOW" in perms:
            privilege_scores.append(55.0)
        else:
            privilege_scores.append(40.0)
    privilege_factor = round(sum(privilege_scores) / len(privilege_scores), 2)

    # 4. Detection Evidence Level (Module 1 Correlation) (0-100)
    # Does any node along the path match active detection alerts?
    evidence_score = 15.0  # Baseline low assumption
    path_set = set(path)
    for ev in detection_evidence:
        dev_id = ev.get("device_id") or ev.get("asset_id")
        if dev_id in path_set:
            status = ev.get("threat_status", "").upper()
            if status == "MALICIOUS":
                evidence_score = max(evidence_score, 95.0)
            elif status == "SUSPICIOUS":
                evidence_score = max(evidence_score, 75.0)
            else:
                evidence_score = max(evidence_score, 40.0)
    detection_factor = round(evidence_score, 2)

    # 5. Network Exposure Index (0-100)
    # Based on entry zone perimeter exposure
    source_zone = source_data.get("zone", "Corporate")
    exposure_factor = round(ZONE_EXPOSURE_SCORES.get(source_zone, 50.0), 2)

    # 6. Path Hop Penalty / Velocity (0-100)
    # Fewer hops mean fewer defense inspection layers and faster potential propagation
    # 1 hop -> 100, 2 hops -> 85, 3 hops -> 70, 4 hops -> 55, 5+ hops -> 40
    hop_penalty = max(30.0, 100.0 - (hops - 1) * 15.0)

    # Multi-factor Weighted Risk Composite Formula
    # Target Criticality: 30%, Vulnerability Density: 25%, Detection Evidence: 20%, Privilege: 15%, Velocity: 10%
    raw_composite = (
        0.30 * target_crit_score +
        0.25 * vulnerability_factor +
        0.20 * detection_factor +
        0.15 * privilege_factor +
        0.10 * hop_penalty
    )

    final_risk = round(min(100.0, max(10.0, raw_composite)), 1)

    # Risk Category mapping
    if final_risk >= 80.0:
        category = "CRITICAL"
    elif final_risk >= 65.0:
        category = "HIGH"
    elif final_risk >= 45.0:
        category = "MEDIUM"
    else:
        category = "LOW"

    # Estimated traversal time (minutes)
    # Each hop takes time based on security friction (higher privilege/lower vuln takes longer)
    estimated_time = 0.0
    for i in range(hops):
        u, v = path[i], path[i + 1]
        edge = G.get_edge_data(u, v) or {}
        friction = edge.get("traversal_cost", 1.5)
        v_vuln = G.nodes[v].get("vuln_score", 0.5)
        hop_mins = max(4.0, friction * 6.0 * (1.2 - v_vuln))
        estimated_time += hop_mins
    estimated_time = round(estimated_time, 1)

    factors = RiskFactorBreakdown(
        vulnerability_severity=vulnerability_factor,
        asset_criticality=target_crit_score,
        privilege_access_level=privilege_factor,
        detection_evidence_level=detection_factor,
        exposure_index=exposure_factor,
        path_hop_penalty=hop_penalty,
    )

    assumptions = [
        f"Target '{target_data.get('name', target_node)}' holds {target_data.get('criticality')} organizational data assets.",
        f"Entry point begins at {source_data.get('name', source_node)} in the {source_zone} zone.",
        f"Traversed {hops} intermediate hop boundaries across {len(set(G.nodes[n].get('zone') for n in path))} security zones.",
        "Attacker is assumed to possess network reachability without active multi-factor challenge on internal hops.",
    ]

    ranking_explanation = (
        f"Path scored {final_risk}/100 ({category}). Primary risk drivers: "
        f"destination criticality ({target_crit_score:.0f}/100), traversed vulnerability density ({vulnerability_factor:.0f}/100), "
        f"and {detection_factor:.0f}/100 active neural threat correlation."
    )

    return final_risk, category, factors, estimated_time, assumptions, ranking_explanation
