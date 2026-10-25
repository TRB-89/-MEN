"""Explanation and narrative generation engine for candidate attack paths.

Synthesizes graph topology metadata, MITRE ATT&CK techniques, open port permissions,
and neural detection evidence into clear, actionable technical explanations.
"""

from typing import Dict, List, Any
import networkx as nx

from backend.path_prediction.schemas import HopDetail, CriticalChokepoint
from backend.path_prediction.mitre_kb import resolve_mitre_technique


def build_hop_explanations(
    path: List[str],
    G: nx.DiGraph,
    detection_evidence: List[Dict[str, Any]],
) -> List[HopDetail]:
    """Generate detailed step-by-step technical explanations for each hop in an attack path."""
    hops: List[HopDetail] = []
    evidence_by_node: Dict[str, List[str]] = {}

    for ev in detection_evidence:
        dev = ev.get("device_id") or ev.get("asset_id")
        if dev:
            status = ev.get("threat_status", "UNKNOWN")
            cat = ev.get("detected_attack_cat") or ev.get("attack_category") or "Suspicious Activity"
            evidence_by_node.setdefault(dev, []).append(f"[{status}] {cat}")

    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        edge = G.get_edge_data(u, v) or {}
        v_data = G.nodes[v]
        u_data = G.nodes[u]

        protocol = edge.get("protocol", "TCP")
        port = edge.get("port", 0)
        rel_type = edge.get("relationship_type", "NETWORK_FLOW")
        perms = edge.get("access_permissions") or f"ALLOW {protocol}/{port}"

        # Mitre technique mapping
        target_attack_cat = None
        if v in evidence_by_node and len(evidence_by_node[v]) > 0:
            target_attack_cat = evidence_by_node[v][0]
        mitre = resolve_mitre_technique(u, v, protocol, port, target_attack_cat)

        # Hop risk score
        vuln_score = float(v_data.get("vuln_score", 0.5))
        friction = float(edge.get("traversal_cost", 1.5))
        hop_risk = min(100.0, max(15.0, (vuln_score * 60.0 + 30.0) / max(0.6, friction * 0.5)))
        hop_risk = round(hop_risk, 1)

        # Hop estimated traversal time
        hop_time = max(3.0, friction * 5.0 * (1.1 - vuln_score))
        hop_time = round(hop_time, 1)

        indicators = evidence_by_node.get(u, []) + evidence_by_node.get(v, [])

        explanation = (
            f"Adversary pivots from {u_data.get('name', u)} ({u_data.get('zone')}) to "
            f"{v_data.get('name', v)} ({v_data.get('zone')}) over {protocol}/{port} via '{rel_type}'. "
            f"Allowed by rule: '{perms}'. Exploits {mitre['name']} ({mitre['id']})."
        )

        hops.append(
            HopDetail(
                hop_index=i + 1,
                from_node=u,
                from_name=u_data.get("name", u),
                to_node=v,
                to_name=v_data.get("name", v),
                protocol=protocol,
                port=port,
                relationship_type=rel_type,
                access_permissions=perms,
                mitre_technique_id=mitre["id"],
                mitre_technique_name=mitre["name"],
                mitre_tactic=mitre["tactic"],
                hop_risk_score=hop_risk,
                estimated_traversal_time_mins=hop_time,
                detection_indicators=indicators[:3],
                explanation=explanation,
            )
        )

    return hops


def extract_chokepoints(
    paths: List[List[str]],
    G: nx.DiGraph,
) -> List[CriticalChokepoint]:
    """Identify intermediate assets that appear most frequently across candidate paths."""
    counter: Dict[str, int] = {}
    for p in paths:
        # Intermediate nodes only (excluding source and destination)
        for node in p[1:-1]:
            counter[node] = counter.get(node, 0) + 1

    ranked = sorted(counter.items(), key=lambda x: x[1], reverse=True)
    chokepoints: List[CriticalChokepoint] = []

    for nid, count in ranked[:5]:
        data = G.nodes.get(nid, {})
        name = data.get("name", nid)
        crit = data.get("criticality", "MEDIUM")
        zone = data.get("zone", "Corporate")

        action = (
            f"Isolate {name} or restrict inter-zone routing from {zone} to eliminate "
            f"{count} potential attack corridor{'s' if count > 1 else ''}."
        )

        chokepoints.append(
            CriticalChokepoint(
                node_id=nid,
                name=name,
                frequency=count,
                criticality=crit,
                recommended_action=action,
            )
        )

    return chokepoints
