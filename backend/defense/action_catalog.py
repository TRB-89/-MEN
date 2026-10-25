"""Defensive Action Catalog and Strategy Generation Engine.

Defines the four core simulated defense mechanisms and enumerates candidate strategies
derived from NetworkX topology and Module 3 attack-path predictions.
"""

from typing import Dict, List, Any, Optional
import networkx as nx
from backend.defense.schemas import DefenseActionType, DefenseActionDefinition

# Baseline operational disruption costs by device type and zone
NODE_DISRUPTION_BASELINE = {
    "workstation": 15.0,  # Single user impacted
    "server": 45.0,       # Service disruption
    "switch": 85.0,       # Large subnet disconnection
    "firewall": 95.0,     # Perimeter breakdown
    "domain_controller": 90.0, # Complete authentication disruption
    "database": 90.0,     # Core transactional outage
    "gateway": 95.0,      # Ingress outage
}

ZONE_DISRUPTION_MULTIPLIER = {
    "Corporate": 1.0,
    "DMZ": 1.2,
    "Core": 1.6,
    "Restricted": 1.8,
    "Perimeter": 1.5,
}


def generate_candidate_actions(
    G: nx.DiGraph,
    attack_paths: List[List[str]],
    entry_node: str,
) -> List[DefenseActionDefinition]:
    """Generate candidate defensive actions across all 4 defense archetypes."""
    candidates: List[DefenseActionDefinition] = []
    seen_keys = set()

    # 1. Action A: Workstation / Node Isolation candidates
    # Identify intermediate nodes in attack paths
    node_frequencies: Dict[str, int] = {}
    for p in attack_paths:
        for n in p[1:-1]:
            node_frequencies[n] = node_frequencies.get(n, 0) + 1

    for nid, freq in sorted(node_frequencies.items(), key=lambda x: x[1], reverse=True):
        if nid not in G or nid == entry_node:
            continue
        ndata = G.nodes[nid]
        dev_type = ndata.get("device_type", "workstation")
        zone = ndata.get("zone", "Corporate")
        name = ndata.get("name", nid)

        cost = min(95.0, NODE_DISRUPTION_BASELINE.get(dev_type, 30.0) * ZONE_EXPOSURE(zone))
        level = "CRITICAL" if cost > 80 else "HIGH" if cost > 55 else "MEDIUM" if cost > 30 else "LOW"

        action = DefenseActionDefinition(
            action_type=DefenseActionType.WORKSTATION_ISOLATION,
            target_entity=nid,
            target_name=name,
            target_zone=zone,
            description=f"Quarantine host '{name}' ({nid}) from all ingress and egress network flows.",
            disruption_level=level,
            disruption_cost=round(cost, 1),
        )
        candidates.append(action)
        seen_keys.add(f"ISO:{nid}")

    # 2. Action B: Connection Restriction candidates
    # Identify critical intermediate edges traversed in attack paths
    edge_frequencies: Dict[tuple, int] = {}
    for p in attack_paths:
        for i in range(len(p) - 1):
            u, v = p[i], p[i + 1]
            edge_frequencies[(u, v)] = edge_frequencies.get((u, v), 0) + 1

    for (u, v), freq in sorted(edge_frequencies.items(), key=lambda x: x[1], reverse=True):
        if not G.has_edge(u, v):
            continue
        edata = G.get_edge_data(u, v) or {}
        protocol = edata.get("protocol", "TCP")
        port = edata.get("port", 0)
        u_name = G.nodes[u].get("name", u)
        v_name = G.nodes[v].get("name", v)

        cost = 20.0 if port in (445, 22, 3389) else 35.0
        edge_id = f"{u}->{v}"

        action = DefenseActionDefinition(
            action_type=DefenseActionType.CONNECTION_RESTRICTION,
            target_entity=edge_id,
            target_name=f"{u_name} → {v_name}",
            target_zone=G.nodes[u].get("zone"),
            target_edge={"source": u, "target": v, "protocol": protocol, "port": port},
            description=f"Sever {protocol} port {port} ingress route from {u_name} to {v_name}.",
            disruption_level="LOW" if cost <= 25 else "MEDIUM",
            disruption_cost=round(cost, 1),
        )
        candidates.append(action)

    # 3. Action C: Session Revocation candidates
    # Identify authentication relationships (e.g. Kerberos, Domain Admin, DBA)
    for (u, v), edata in G.edges.items():
        rel_type = (edata.get("relationship_type") or "").upper()
        port = edata.get("port", 0)
        if "AUTHENTICATES_TO" in rel_type or "MANAGES" in rel_type or port in (88, 389):
            u_name = G.nodes[u].get("name", u)
            v_name = G.nodes[v].get("name", v)
            edge_id = f"{u}->{v}"

            action = DefenseActionDefinition(
                action_type=DefenseActionType.SESSION_REVOCATION,
                target_entity=edge_id,
                target_name=f"Auth Ticket: {u_name} → {v_name}",
                target_zone=G.nodes[u].get("zone"),
                target_edge={"source": u, "target": v, "protocol": "KERBEROS", "port": port},
                description=f"Revoke active TGS tickets and privileged logon sessions between {u_name} and {v_name}.",
                disruption_level="LOW",
                disruption_cost=10.0,
            )
            candidates.append(action)

    # 4. Action D: Enhanced Monitoring & Honeypot Sensor candidates
    # Deploy aggressive monitoring on key junction assets
    for nid in ["sw-core-01", "srv-proxy-01", "dc-01", "ws-admin-01"]:
        if nid in G and nid != entry_node:
            name = G.nodes[nid].get("name", nid)
            action = DefenseActionDefinition(
                action_type=DefenseActionType.ENHANCED_MONITORING,
                target_entity=nid,
                target_name=name,
                target_zone=G.nodes[nid].get("zone"),
                description=f"Deploy aggressive EDR netflow sensor and synthetic canary credentials on {name}.",
                disruption_level="NONE",
                disruption_cost=0.0,
            )
            candidates.append(action)

    return candidates


def ZONE_EXPOSURE(zone: str) -> float:
    return ZONE_DISRUPTION_MULTIPLIER.get(zone, 1.0)
