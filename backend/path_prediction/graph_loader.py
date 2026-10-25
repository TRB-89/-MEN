"""Graph topology loader and NetworkX builder for Module 3 attack path analysis.

Extracts enterprise topology from SQLite database models, applies node isolation filters,
and builds an annotated directed graph with nonnegative traversal weights.
"""

import hashlib
import json
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx
from sqlalchemy.orm import Session

from backend.database.db import NetworkAssetRecord, NetworkRelationshipRecord
from backend.graph_engine.topology import build_network_graph, DEVICE_DATA, EDGE_DATA


def load_prediction_graph(
    db: Optional[Session] = None,
    isolated_nodes: Optional[List[str]] = None,
) -> Tuple[nx.DiGraph, str]:
    """Build a NetworkX DiGraph populated from database records or synthetic topology.
    
    Returns:
        Tuple of (DiGraph, topology_snapshot_id)
    """
    quarantined = set(isolated_nodes or [])
    G = nx.DiGraph()

    # 1. Try loading from SQLite database records
    assets: List[Dict[str, Any]] = []
    relationships: List[Dict[str, Any]] = []

    if db is not None:
        try:
            asset_records = db.query(NetworkAssetRecord).all()
            if asset_records:
                assets = [rec.to_dict() for rec in asset_records]
            rel_records = db.query(NetworkRelationshipRecord).all()
            if rel_records:
                relationships = [rel.to_dict() for rel in rel_records]
        except Exception:
            assets = []
            relationships = []

    # 2. Fallback to hardcoded topology if database has not yet seeded
    if not assets:
        assets = list(DEVICE_DATA)
    if not relationships:
        relationships = list(EDGE_DATA)

    # 3. Insert nodes into NetworkX DiGraph
    for asset in assets:
        nid = asset.get("id")
        if not nid:
            continue
        
        # Check if node is permanently or dynamically isolated
        is_isolated = bool(asset.get("isolated", False)) or (nid in quarantined)
        if is_isolated:
            continue

        vulns = asset.get("vulnerabilities", [])
        if isinstance(vulns, str):
            try:
                vulns = json.loads(vulns)
            except Exception:
                vulns = [vulns]

        G.add_node(
            nid,
            id=nid,
            name=asset.get("name", nid),
            zone=asset.get("zone", "Corporate"),
            subnet=asset.get("subnet", ""),
            ip=asset.get("ip", ""),
            device_type=asset.get("device_type", asset.get("asset_type", "workstation")),
            criticality=asset.get("criticality", "MEDIUM"),
            security_status=asset.get("security_status", "SECURE"),
            vuln_score=float(asset.get("vuln_score", 0.5)),
            vulnerabilities=vulns,
            compromised=bool(asset.get("compromised", False)),
            isolated=False,
        )

    # 4. Insert directed edges with friction costs
    for rel in relationships:
        src = rel.get("source") or rel.get("source_id")
        tgt = rel.get("target") or rel.get("target_id")

        if not src or not tgt or src not in G or tgt not in G:
            continue

        raw_weight = float(rel.get("weight", 1.0))
        target_vuln = G.nodes[tgt].get("vuln_score", 0.5)

        # Graph search traversal friction cost (nonnegative):
        # Higher target vulnerability reduces friction; higher relationship weight reduces friction
        traversal_cost = max(0.2, (2.0 / max(0.5, raw_weight)) + (1.0 - target_vuln) * 2.0)

        protocol = rel.get("protocol", "TCP")
        port = int(rel.get("port", 0))
        perms = rel.get("access_permissions") or f"ALLOW {protocol}/{port}"

        G.add_edge(
            src,
            tgt,
            weight=raw_weight,
            traversal_cost=round(traversal_cost, 3),
            protocol=protocol,
            port=port,
            relationship_type=rel.get("relationship_type", "NETWORK_FLOW"),
            access_permissions=perms,
            observation_source=rel.get("observation_source", "NETFLOW_TELEMETRY"),
        )

    # 5. Compute snapshot hash
    snapshot_raw = f"nodes:{len(G.nodes)}:edges:{len(G.edges)}:isolated:{sorted(quarantined)}"
    snapshot_id = f"SNAP-{hashlib.md5(snapshot_raw.encode('utf-8')).hexdigest()[:8].upper()}"

    return G, snapshot_id
