"""Graph-search path discovery algorithms using NetworkX.

Executes reachability analysis, bounded candidate-path enumeration, and shortest-friction
traversal while capping combinatorial complexity to ensure responsive performance.
"""

from typing import List, Optional, Set
import networkx as nx

MAX_EXPLORATION_PATHS = 50  # Hard ceiling on raw paths inspected to prevent CPU/memory exhaustion


def find_candidate_paths(
    G: nx.DiGraph,
    source_node: str,
    target_node: Optional[str] = None,
    max_depth: int = 5,
    top_k: int = 5,
) -> List[List[str]]:
    """Discover candidate attack paths from source to target asset(s).

    Returns a list of node-id lists, each representing a simple path from source to target.
    """
    if source_node not in G:
        return []

    # 1. Determine target candidate nodes
    if target_node:
        if target_node not in G or target_node == source_node:
            return []
        targets = [target_node]
    else:
        # If no target specified, evaluate reachability to all CRITICAL assets
        targets = [
            n for n, d in G.nodes(data=True)
            if d.get("criticality") == "CRITICAL" and n != source_node
        ]

    discovered_paths: List[List[str]] = []
    seen_path_signatures: Set[str] = set()

    for tgt in targets:
        # Check reachability first
        if not nx.has_path(G, source_node, tgt):
            continue

        # Find shortest traversal friction path first (Dijkstra using traversal_cost)
        try:
            shortest = nx.shortest_path(G, source=source_node, target=tgt, weight="traversal_cost")
            if len(shortest) - 1 <= max_depth:
                sig = "->".join(shortest)
                if sig not in seen_path_signatures:
                    discovered_paths.append(shortest)
                    seen_path_signatures.add(sig)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            pass

        # Bounded simple path enumeration capped at MAX_EXPLORATION_PATHS
        try:
            count = 0
            for path in nx.all_simple_paths(G, source=source_node, target=tgt, cutoff=max_depth):
                sig = "->".join(path)
                if sig not in seen_path_signatures:
                    discovered_paths.append(path)
                    seen_path_signatures.add(sig)
                count += 1
                if count >= MAX_EXPLORATION_PATHS:
                    break
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            continue

    return discovered_paths
