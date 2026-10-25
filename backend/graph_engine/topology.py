"""Network topology graph generation, correlation, and query engine using NetworkX.

Builds an enterprise attack graph spanning Perimeter DMZ, Corporate LAN,
Core Infrastructure, and Restricted Crown-Jewel zones, persisted in SQLite
and queried dynamically with NetworkX.
"""

import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx
from sqlalchemy.orm import Session

# 16 Enterprise Assets: Employee Workstations, App Servers, File Servers,
# Authentication Server, Database Server, Gateway, Firewall, Switch, User Identity.
DEVICE_DATA: List[Dict[str, Any]] = [
    {
        "id": "gw-ext-01",
        "name": "Edge Gateway Router",
        "zone": "Perimeter",
        "subnet": "198.51.100.0/24",
        "ip": "198.51.100.1",
        "device_type": "gateway",
        "criticality": "HIGH",
        "vulnerabilities": ["CVE-2023-3519 (CVSS 9.8)", "Exposed Management Port"],
        "vuln_score": 0.85,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "fw-dmz-01",
        "name": "NextGen DMZ Firewall",
        "zone": "Perimeter",
        "subnet": "10.0.1.0/24",
        "ip": "10.0.1.1",
        "device_type": "firewall",
        "criticality": "CRITICAL",
        "vulnerabilities": [],
        "vuln_score": 0.15,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "srv-web-01",
        "name": "Public Portal App Server",
        "zone": "DMZ",
        "subnet": "10.0.1.0/24",
        "ip": "10.0.1.10",
        "device_type": "server",
        "criticality": "MEDIUM",
        "vulnerabilities": ["CVE-2024-21413 (CVSS 8.8)", "Outdated OpenSSL"],
        "vuln_score": 0.75,
        "isolated": False,
        "compromised": True,  # Default foothold candidate for simulations
    },
    {
        "id": "srv-proxy-01",
        "name": "Reverse Proxy & TLS Terminator",
        "zone": "DMZ",
        "subnet": "10.0.1.0/24",
        "ip": "10.0.1.20",
        "device_type": "server",
        "criticality": "MEDIUM",
        "vulnerabilities": ["CVE-2023-44487 (CVSS 7.5 HTTP/2 Rapid Reset)"],
        "vuln_score": 0.60,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "sw-core-01",
        "name": "Core Layer-3 Switch",
        "zone": "Core",
        "subnet": "10.0.2.0/24",
        "ip": "10.0.2.1",
        "device_type": "switch",
        "criticality": "HIGH",
        "vulnerabilities": [],
        "vuln_score": 0.20,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "dc-01",
        "name": "Primary Active Directory DC",
        "zone": "Core",
        "subnet": "10.0.2.0/24",
        "ip": "10.0.2.10",
        "device_type": "domain_controller",
        "criticality": "CRITICAL",
        "vulnerabilities": ["CVE-2020-1472 (Zerologon)", "Weak Kerberos Pre-Auth"],
        "vuln_score": 0.90,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "srv-dns-01",
        "name": "Internal DNS/DHCP Authority",
        "zone": "Core",
        "subnet": "10.0.2.0/24",
        "ip": "10.0.2.15",
        "device_type": "server",
        "criticality": "HIGH",
        "vulnerabilities": ["CVE-2021-34527 (PrintNightmare DLL)"],
        "vuln_score": 0.65,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "srv-patch-01",
        "name": "WSUS Systems Distribution Server",
        "zone": "Core",
        "subnet": "10.0.2.0/24",
        "ip": "10.0.2.25",
        "device_type": "server",
        "criticality": "MEDIUM",
        "vulnerabilities": ["CVE-2023-23397 (NTLM Reflection)"],
        "vuln_score": 0.55,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "ws-admin-01",
        "name": "SecOps Tier-0 Admin Station",
        "zone": "Corporate",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.101",
        "device_type": "workstation",
        "criticality": "CRITICAL",
        "vulnerabilities": ["Privileged Session Credential Caching"],
        "vuln_score": 0.70,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "ws-hr-02",
        "name": "Human Resources Workstation",
        "zone": "Corporate",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.102",
        "device_type": "workstation",
        "criticality": "LOW",
        "vulnerabilities": ["Phishing Susceptibility", "CVE-2023-38831"],
        "vuln_score": 0.50,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "ws-fin-03",
        "name": "Finance & Wire Transfer Terminal",
        "zone": "Corporate",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.103",
        "device_type": "workstation",
        "criticality": "HIGH",
        "vulnerabilities": ["CVE-2024-21412", "Excel Macro Enabled"],
        "vuln_score": 0.65,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "ws-dev-04",
        "name": "Lead Developer Workstation",
        "zone": "Corporate",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.104",
        "device_type": "workstation",
        "criticality": "MEDIUM",
        "vulnerabilities": ["Embedded SSH Keys", "Local Sudo Elevation"],
        "vuln_score": 0.80,
        "isolated": False,
        "compromised": True,  # Secondary breach foothold
    },
    {
        "id": "ws-ops-05",
        "name": "DevOps Kubernetes Jumpbox",
        "zone": "Corporate",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.105",
        "device_type": "workstation",
        "criticality": "HIGH",
        "vulnerabilities": ["CVE-2024-38063 (IPv6 Stack Flaw)"],
        "vuln_score": 0.72,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "db-prod-01",
        "name": "Core SQL Transaction Database",
        "zone": "Restricted",
        "subnet": "10.0.4.0/24",
        "ip": "10.0.4.50",
        "device_type": "database",
        "criticality": "CRITICAL",
        "vulnerabilities": ["CVE-2023-34362 (SQLi Injection Vector)"],
        "vuln_score": 0.85,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "srv-backup-01",
        "name": "Immutable Cold Backup Vault",
        "zone": "Restricted",
        "subnet": "10.0.4.0/24",
        "ip": "10.0.4.99",
        "device_type": "storage",
        "criticality": "CRITICAL",
        "vulnerabilities": [],
        "vuln_score": 0.10,
        "isolated": False,
        "compromised": False,
    },
    {
        "id": "usr-secadmin",
        "name": "SecOps Lead (Domain Admin Principal)",
        "zone": "Core",
        "subnet": "10.0.3.0/24",
        "ip": "10.0.3.101",
        "device_type": "identity",
        "criticality": "CRITICAL",
        "vulnerabilities": ["Privileged Domain Admin SID Caching"],
        "vuln_score": 0.88,
        "isolated": False,
        "compromised": False,
    },
]

# Directed connections representing routable network traffic paths and access relationships
EDGE_DATA: List[Dict[str, Any]] = [
    # Perimeter to DMZ
    {
        "source": "gw-ext-01",
        "target": "fw-dmz-01",
        "protocol": "BGP/IP",
        "port": 179,
        "weight": 1.0,
        "relationship_type": "ROUTING",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW BGP/179",
        "observation_source": "FIREWALL_CONFIG",
    },
    {
        "source": "fw-dmz-01",
        "target": "srv-web-01",
        "protocol": "HTTPS",
        "port": 443,
        "weight": 1.2,
        "relationship_type": "ALLOWS_TRAFFIC",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/443",
        "observation_source": "FIREWALL_CONFIG",
    },
    {
        "source": "fw-dmz-01",
        "target": "srv-proxy-01",
        "protocol": "HTTPS",
        "port": 8443,
        "weight": 1.1,
        "relationship_type": "ALLOWS_TRAFFIC",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/8443",
        "observation_source": "FIREWALL_CONFIG",
    },
    # DMZ to Core & Web
    {
        "source": "srv-proxy-01",
        "target": "srv-web-01",
        "protocol": "HTTP",
        "port": 8080,
        "weight": 0.9,
        "relationship_type": "REVERSE_PROXY",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/8080",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "srv-web-01",
        "target": "sw-core-01",
        "protocol": "TCP",
        "port": 8000,
        "weight": 2.5,
        "relationship_type": "NETWORK_FLOW",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/8000",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    # Core Switch to Infrastructure
    {
        "source": "sw-core-01",
        "target": "dc-01",
        "protocol": "Kerberos/LDAP",
        "port": 389,
        "weight": 2.0,
        "relationship_type": "AUTHENTICATES_TO",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/389,88",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
    {
        "source": "sw-core-01",
        "target": "srv-dns-01",
        "protocol": "DNS",
        "port": 53,
        "weight": 1.0,
        "relationship_type": "NAME_RESOLUTION",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW UDP/53",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "sw-core-01",
        "target": "srv-patch-01",
        "protocol": "HTTPS",
        "port": 8531,
        "weight": 1.5,
        "relationship_type": "PATCH_MANAGEMENT",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/8531",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    # Workstations to Core Infrastructure
    {
        "source": "ws-admin-01",
        "target": "dc-01",
        "protocol": "RDP/SMB",
        "port": 3389,
        "weight": 1.1,
        "relationship_type": "ADMIN_SESSION",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/3389,445",
        "observation_source": "RUNTIME_SENSOR",
    },
    {
        "source": "ws-admin-01",
        "target": "sw-core-01",
        "protocol": "SSH",
        "port": 22,
        "weight": 1.0,
        "relationship_type": "MANAGEMENT_ACCESS",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/22",
        "observation_source": "RUNTIME_SENSOR",
    },
    {
        "source": "ws-dev-04",
        "target": "sw-core-01",
        "protocol": "TCP",
        "port": 445,
        "weight": 1.4,
        "relationship_type": "NETWORK_FLOW",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/445",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "ws-dev-04",
        "target": "srv-patch-01",
        "protocol": "HTTP",
        "port": 8530,
        "weight": 1.2,
        "relationship_type": "UPDATE_SYNC",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/8530",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "ws-ops-05",
        "target": "sw-core-01",
        "protocol": "SSH",
        "port": 22,
        "weight": 1.3,
        "relationship_type": "REMOTE_ACCESS",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/22",
        "observation_source": "RUNTIME_SENSOR",
    },
    {
        "source": "ws-hr-02",
        "target": "srv-dns-01",
        "protocol": "DNS",
        "port": 53,
        "weight": 1.0,
        "relationship_type": "NAME_RESOLUTION",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW UDP/53",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "ws-fin-03",
        "target": "dc-01",
        "protocol": "Kerberos",
        "port": 88,
        "weight": 1.5,
        "relationship_type": "AUTHENTICATES_TO",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/88",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
    # Lateral movements across workstations (SMB/RPC/WinRM)
    {
        "source": "ws-dev-04",
        "target": "ws-ops-05",
        "protocol": "SMB",
        "port": 445,
        "weight": 1.5,
        "relationship_type": "PEER_RPC",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/445",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "ws-dev-04",
        "target": "ws-admin-01",
        "protocol": "WinRM",
        "port": 5985,
        "weight": 2.8,
        "relationship_type": "LATERAL_PROBE",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/5985",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "ws-ops-05",
        "target": "ws-fin-03",
        "protocol": "RDP",
        "port": 3389,
        "weight": 2.2,
        "relationship_type": "PEER_REMOTE",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/3389",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    {
        "source": "srv-web-01",
        "target": "ws-dev-04",
        "protocol": "SSH-Tunnel",
        "port": 2222,
        "weight": 2.0,
        "relationship_type": "INBOUND_TUNNEL",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/2222",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    # Core/Admin access to Crown Jewels
    {
        "source": "sw-core-01",
        "target": "db-prod-01",
        "protocol": "TDS/SQL",
        "port": 1433,
        "weight": 2.5,
        "relationship_type": "DATABASE_TRANSIT",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/1433",
        "observation_source": "FIREWALL_CONFIG",
    },
    {
        "source": "ws-admin-01",
        "target": "db-prod-01",
        "protocol": "SQL-Admin",
        "port": 1433,
        "weight": 1.8,
        "relationship_type": "DBA_MANAGEMENT",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/1433",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
    {
        "source": "dc-01",
        "target": "db-prod-01",
        "protocol": "Kerberos-Auth",
        "port": 88,
        "weight": 1.6,
        "relationship_type": "SERVICE_TICKET",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/88",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
    {
        "source": "db-prod-01",
        "target": "srv-backup-01",
        "protocol": "TLS-Replication",
        "port": 9000,
        "weight": 3.0,
        "relationship_type": "REPLICATES_TO",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/9000",
        "observation_source": "FIREWALL_CONFIG",
    },
    {
        "source": "ws-ops-05",
        "target": "db-prod-01",
        "protocol": "DB-Client",
        "port": 1433,
        "weight": 3.5,
        "relationship_type": "APP_QUERY",
        "direction": "DIRECTED",
        "access_permissions": "ALLOW TCP/1433",
        "observation_source": "NETFLOW_TELEMETRY",
    },
    # User Identity Relationships
    {
        "source": "usr-secadmin",
        "target": "ws-admin-01",
        "protocol": "LOCAL_LOGON",
        "port": 0,
        "weight": 1.0,
        "relationship_type": "AUTHENTICATES_TO",
        "direction": "DIRECTED",
        "access_permissions": "LOGON_INTERACTIVE",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
    {
        "source": "usr-secadmin",
        "target": "dc-01",
        "protocol": "Kerberos",
        "port": 88,
        "weight": 1.0,
        "relationship_type": "AUTHENTICATES_TO",
        "direction": "DIRECTED",
        "access_permissions": "TGT_REQUEST",
        "observation_source": "ACTIVE_DIRECTORY_AUDIT",
    },
]


def build_network_graph(isolated_nodes: Optional[List[str]] = None, db: Optional[Session] = None) -> nx.DiGraph:
    """Build and return a NetworkX DiGraph instance.
    
    If db is provided, loads the state dynamically from SQLite.
    Otherwise falls back to the in-memory DEVICE_DATA and EDGE_DATA.
    """
    from backend.database.db import NetworkAssetRecord, NetworkRelationshipRecord, NetworkAlertRecord

    isolated = set(isolated_nodes or [])
    G = nx.DiGraph()

    if db is not None:
        try:
            asset_records = db.query(NetworkAssetRecord).all()
            if asset_records:
                # Pre-fetch active alert counts per asset
                alert_counts = {}
                alerts = db.query(NetworkAlertRecord).filter(NetworkAlertRecord.is_matched == 1).all()
                for al in alerts:
                    if al.asset_id:
                        alert_counts[al.asset_id] = alert_counts.get(al.asset_id, 0) + 1

                for asset in asset_records:
                    asset_dict = asset.to_dict()
                    if asset_dict["id"] in isolated or asset.isolated:
                        asset_dict["isolated"] = True
                        isolated.add(asset_dict["id"])
                    asset_dict["active_alerts_count"] = alert_counts.get(asset_dict["id"], 0)
                    G.add_node(asset_dict["id"], **asset_dict)

                rel_records = db.query(NetworkRelationshipRecord).all()
                for rel in rel_records:
                    src = rel.source_id
                    dst = rel.target_id
                    if src in isolated or dst in isolated:
                        continue
                    G.add_edge(src, dst, **rel.to_dict())

                return G
        except Exception:
            # Fall back to in-memory definition
            pass

    # In-memory baseline graph construction
    for dev in DEVICE_DATA:
        dev_copy = dict(dev)
        if dev_copy["id"] in isolated:
            dev_copy["isolated"] = True
        dev_copy["active_alerts_count"] = 1 if dev_copy.get("compromised") else 0
        dev_copy["security_status"] = "COMPROMISED" if dev_copy.get("compromised") else ("ISOLATED" if dev_copy.get("isolated") else "SECURE")
        G.add_node(dev_copy["id"], **dev_copy)

    for edge in EDGE_DATA:
        src = edge["source"]
        dst = edge["target"]
        if src in isolated or dst in isolated:
            continue
        G.add_edge(src, dst, **edge)

    return G


def export_topology(isolated_nodes: Optional[List[str]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    """Export the topology graph to a rich JSON-serializable dictionary."""
    G = build_network_graph(isolated_nodes, db)
    nodes = [dict(data) for _, data in G.nodes(data=True)]
    edges = [
        {
            "id": f"e-{u}-{v}",
            "source": u,
            "target": v,
            "protocol": data.get("protocol", "TCP"),
            "port": data.get("port", 0),
            "weight": data.get("weight", 1.0),
            "relationship_type": data.get("relationship_type", "NETWORK_FLOW"),
            "access_permissions": data.get("access_permissions", f"ALLOW {data.get('protocol', 'TCP')}/{data.get('port', 0)}"),
            "observation_source": data.get("observation_source", "NETFLOW_TELEMETRY"),
        }
        for u, v, data in G.edges(data=True)
    ]

    # Calculate graph intelligence metrics
    num_nodes = len(nodes)
    num_edges = len(edges)
    density = round(nx.density(G), 4) if num_nodes > 1 else 0.0
    wcc_count = nx.number_weakly_connected_components(G) if num_nodes > 0 else 0

    compromised_count = sum(1 for n in nodes if n.get("security_status") == "COMPROMISED" or n.get("compromised"))
    suspicious_count = sum(1 for n in nodes if n.get("security_status") == "SUSPICIOUS")
    isolated_count = sum(1 for n in nodes if n.get("isolated"))
    secure_count = sum(1 for n in nodes if n.get("security_status") == "SECURE" and not n.get("isolated"))

    return {
        "nodes_count": num_nodes,
        "edges_count": num_edges,
        "isolated_nodes": list(isolated_nodes or []),
        "nodes": nodes,
        "edges": edges,
        "metrics": {
            "density": density,
            "weakly_connected_components": wcc_count,
            "compromised_count": compromised_count,
            "suspicious_count": suspicious_count,
            "isolated_count": isolated_count,
            "secure_count": secure_count,
            "total_assets": num_nodes,
            "total_relationships": num_edges,
        },
    }


def get_device(device_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Lookup device details by ID, with neighbor connectivity and alerts."""
    from backend.database.db import NetworkAssetRecord, NetworkAlertRecord

    if db is not None:
        try:
            asset = db.query(NetworkAssetRecord).filter(NetworkAssetRecord.id == device_id).first()
            if asset:
                data = asset.to_dict()
                # Attach alerts
                alerts = db.query(NetworkAlertRecord).filter(
                    NetworkAlertRecord.asset_id == device_id
                ).order_by(NetworkAlertRecord.timestamp.desc()).limit(10).all()
                data["associated_alerts"] = [a.to_dict() for a in alerts]
                return data
        except Exception:
            pass

    for dev in DEVICE_DATA:
        if dev["id"].lower() == device_id.lower():
            dev_copy = dict(dev)
            dev_copy["associated_alerts"] = []
            return dev_copy
    return None


def get_asset_details(asset_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """Comprehensive asset inspection including topological neighbors and permitted paths."""
    from backend.database.db import NetworkAssetRecord, NetworkAlertRecord

    G = build_network_graph(db=db)
    base_data = get_device(asset_id, db=db)
    if not base_data:
        return None

    in_neighbors = []
    out_neighbors = []
    permitted_routes = []

    if asset_id in G:
        for pred in G.predecessors(asset_id):
            edge_data = G.get_edge_data(pred, asset_id) or {}
            in_neighbors.append({
                "neighbor_id": pred,
                "protocol": edge_data.get("protocol", "TCP"),
                "port": edge_data.get("port", 0),
                "relationship_type": edge_data.get("relationship_type", "NETWORK_FLOW"),
                "access_permissions": edge_data.get("access_permissions"),
            })

        for succ in G.successors(asset_id):
            edge_data = G.get_edge_data(asset_id, succ) or {}
            out_neighbors.append({
                "neighbor_id": succ,
                "protocol": edge_data.get("protocol", "TCP"),
                "port": edge_data.get("port", 0),
                "relationship_type": edge_data.get("relationship_type", "NETWORK_FLOW"),
                "access_permissions": edge_data.get("access_permissions"),
            })

        # Calculate reachable crown jewels
        crown_jewels = ["db-prod-01", "srv-backup-01", "dc-01"]
        for target in crown_jewels:
            if target != asset_id and target in G:
                if nx.has_path(G, asset_id, target):
                    try:
                        shortest = nx.shortest_path(G, asset_id, target)
                        permitted_routes.append({
                            "target": target,
                            "hops": len(shortest) - 1,
                            "path": shortest,
                        })
                    except Exception:
                        pass

    # Attach alerts from DB
    associated_alerts = []
    if db is not None:
        try:
            alerts = db.query(NetworkAlertRecord).filter(
                NetworkAlertRecord.asset_id == asset_id
            ).order_by(NetworkAlertRecord.timestamp.desc()).limit(20).all()
            associated_alerts = [a.to_dict() for a in alerts]
        except Exception:
            pass

    return {
        **base_data,
        "in_neighbors": in_neighbors,
        "out_neighbors": out_neighbors,
        "in_degree": len(in_neighbors),
        "out_degree": len(out_neighbors),
        "permitted_routes": permitted_routes,
        "associated_alerts": associated_alerts,
    }


def get_network_relationships(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """Retrieve all network relationships with protocol, port, permissions, and observation source."""
    from backend.database.db import NetworkRelationshipRecord

    if db is not None:
        try:
            rels = db.query(NetworkRelationshipRecord).all()
            if rels:
                return [r.to_dict() for r in rels]
        except Exception:
            pass

    return list(EDGE_DATA)


def correlate_event_to_asset(
    db: Session,
    alert_dict: Dict[str, Any],
    flow_event_dict: Dict[str, Any],
) -> Tuple[Optional[str], Any]:
    """Correlate a Module 1 threat alert with an enterprise network asset.

    Workflow:
    1. Match by flow event `device_id` (case-insensitive) against NetworkAssetRecord.id
    2. If not matched, match by `destination_ip`
    3. If not matched, match by `source_ip`
    4. If matched:
       - Update the asset's security_status in SQLite (COMPROMISED or SUSPICIOUS)
       - Link alert to asset
    5. If unmatched:
       - Save to NetworkAlertRecord with is_matched = 0, asset_id = None
       - Do NOT invent an asset association!
    """
    from backend.database.db import NetworkAssetRecord, NetworkAlertRecord

    device_id_candidate = flow_event_dict.get("device_id") or alert_dict.get("device_id")
    dst_ip = flow_event_dict.get("destination_ip") or flow_event_dict.get("dst_ip")
    src_ip = flow_event_dict.get("source_ip") or flow_event_dict.get("src_ip")

    matched_asset: Optional[NetworkAssetRecord] = None

    # 1. Match by Device ID
    if device_id_candidate:
        matched_asset = db.query(NetworkAssetRecord).filter(
            NetworkAssetRecord.id == device_id_candidate.strip().lower()
        ).first()

    # 2. Match by Destination IP
    if not matched_asset and dst_ip:
        matched_asset = db.query(NetworkAssetRecord).filter(
            NetworkAssetRecord.ip == dst_ip.strip()
        ).first()

    # 3. Match by Source IP
    if not matched_asset and src_ip:
        matched_asset = db.query(NetworkAssetRecord).filter(
            NetworkAssetRecord.ip == src_ip.strip()
        ).first()

    threat_status = alert_dict.get("threat_status", "BENIGN").upper()
    severity = alert_dict.get("severity", "LOW").upper()
    event_id = alert_dict.get("event_id") or f"EVT-{datetime.now(timezone.utc).strftime('%H%M%S')}"

    if matched_asset:
        # Update asset status if threat detected
        if threat_status == "MALICIOUS":
            matched_asset.security_status = "COMPROMISED"
        elif threat_status == "SUSPICIOUS" and matched_asset.security_status != "COMPROMISED":
            matched_asset.security_status = "SUSPICIOUS"

        matched_asset.last_activity = datetime.now(timezone.utc)

        alert_record = NetworkAlertRecord(
            id=f"ALT-{event_id}",
            asset_id=matched_asset.id,
            detection_id=event_id,
            threat_status=threat_status,
            severity=severity,
            attack_category=alert_dict.get("attack_category") or alert_dict.get("classification"),
            decision_rule=alert_dict.get("decision_rule", "CONSENSUS_DETECTION"),
            model_scores=json.dumps(alert_dict.get("model_scores", {})),
            supporting_evidence=json.dumps(alert_dict.get("supporting_evidence", {})),
            is_matched=1,
            raw_event_data=json.dumps(flow_event_dict),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(alert_record)
        db.commit()
        return matched_asset.id, alert_record
    else:
        # Unmatched detection — record safely without inventing false asset associations
        unmatched_record = NetworkAlertRecord(
            id=f"ALT-{event_id}",
            asset_id=None,
            detection_id=event_id,
            threat_status=threat_status,
            severity=severity,
            attack_category=alert_dict.get("attack_category") or alert_dict.get("classification"),
            decision_rule=alert_dict.get("decision_rule", "UNMATCHED_FLOW"),
            model_scores=json.dumps(alert_dict.get("model_scores", {})),
            supporting_evidence=json.dumps(alert_dict.get("supporting_evidence", {})),
            is_matched=0,
            raw_event_data=json.dumps(flow_event_dict),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(unmatched_record)
        db.commit()
        return None, unmatched_record


def load_simulation_scenario(db: Session, scenario_type: str) -> Dict[str, Any]:
    """Load or reset a synthetic scenario in the enterprise attack graph.

    Supported Scenarios:
    - baseline: Reset all nodes to SECURE (except legitimate footholds).
    - kerberoasting: ws-dev-04 and dc-01 flagged SUSPICIOUS with MITRE T1558.003 alert.
    - dmz_foothold: srv-web-01 marked COMPROMISED, ws-dev-04 marked SUSPICIOUS.
    - ransomware_staging: ws-ops-05 marked COMPROMISED targeting srv-backup-01.
    - zero_trust_isolation: ws-dev-04 and srv-web-01 isolated.
    """
    from backend.database.db import NetworkAssetRecord, NetworkAlertRecord, SimulationScenarioRecord

    scenario_type = scenario_type.lower().strip()
    assets = db.query(NetworkAssetRecord).all()

    # Clear previous alert records if resetting to baseline
    if scenario_type == "baseline":
        for a in assets:
            a.security_status = "SECURE"
            a.isolated = 0
            a.last_activity = datetime.now(timezone.utc)
        summary = "All enterprise nodes reset to SECURE baseline status. Network telemetry normalized."

    elif scenario_type == "kerberoasting":
        for a in assets:
            if a.id == "ws-dev-04":
                a.security_status = "SUSPICIOUS"
            elif a.id == "dc-01":
                a.security_status = "SUSPICIOUS"
            else:
                a.security_status = "SECURE"
        # Seed an alert record
        alert = NetworkAlertRecord(
            id=f"ALT-KERBEROS-{datetime.now(timezone.utc).strftime('%M%S')}",
            asset_id="ws-dev-04",
            detection_id="SIM-KERB-001",
            threat_status="SUSPICIOUS",
            severity="HIGH",
            attack_category="Lateral Movement / Credential Access",
            decision_rule="SYNTHETIC_SCENARIO_KERBEROASTING",
            model_scores=json.dumps({"rf_probability": 0.82, "anomaly_index": 0.74, "is_anomaly": True}),
            supporting_evidence=json.dumps({
                "mitre": "T1558.003",
                "technique": "Kerberoasting SPN Query Burst",
                "target_host": "dc-01",
                "source_host": "ws-dev-04",
                "synthetic_flag": True,
            }),
            is_matched=1,
            raw_event_data=json.dumps({"proto": "tcp", "service": "kerberos", "port": 88}),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(alert)
        summary = "Kerberoasting SPN ticket request burst simulated: ws-dev-04 targeting dc-01 (T1558.003)."

    elif scenario_type in ("dmz_foothold", "exploitation"):
        for a in assets:
            if a.id == "srv-web-01":
                a.security_status = "COMPROMISED"
            elif a.id == "ws-dev-04":
                a.security_status = "SUSPICIOUS"
        alert = NetworkAlertRecord(
            id=f"ALT-FOOTHOLD-{datetime.now(timezone.utc).strftime('%M%S')}",
            asset_id="srv-web-01",
            detection_id="SIM-DMZ-002",
            threat_status="MALICIOUS",
            severity="CRITICAL",
            attack_category="Exploitation",
            decision_rule="SYNTHETIC_SCENARIO_PUBLIC_WEB_EXPLOIT",
            model_scores=json.dumps({"rf_probability": 0.94, "anomaly_index": 0.88, "is_anomaly": True}),
            supporting_evidence=json.dumps({
                "mitre": "T1190",
                "technique": "Exploit Public-Facing Application",
                "target_host": "srv-web-01",
                "cve": "CVE-2024-21413",
                "synthetic_flag": True,
            }),
            is_matched=1,
            raw_event_data=json.dumps({"proto": "tcp", "service": "http", "port": 443}),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(alert)
        summary = "Public App Server (srv-web-01) compromised via CVE-2024-21413; reverse SSH tunnel established toward ws-dev-04."

    elif scenario_type == "ransomware_staging":
        for a in assets:
            if a.id == "ws-ops-05":
                a.security_status = "COMPROMISED"
            elif a.id == "srv-backup-01":
                a.security_status = "SUSPICIOUS"
        alert = NetworkAlertRecord(
            id=f"ALT-RANSOM-{datetime.now(timezone.utc).strftime('%M%S')}",
            asset_id="ws-ops-05",
            detection_id="SIM-RANSOM-003",
            threat_status="MALICIOUS",
            severity="CRITICAL",
            attack_category="Impact / Exfiltration",
            decision_rule="SYNTHETIC_SCENARIO_BACKUP_VAULT_PROBE",
            model_scores=json.dumps({"rf_probability": 0.96, "anomaly_index": 0.92, "is_anomaly": True}),
            supporting_evidence=json.dumps({
                "mitre": "T1486",
                "technique": "Data Encrypted for Impact",
                "staging_host": "ws-ops-05",
                "target_host": "srv-backup-01",
                "synthetic_flag": True,
            }),
            is_matched=1,
            raw_event_data=json.dumps({"proto": "tcp", "service": "tls", "port": 9000}),
            timestamp=datetime.now(timezone.utc),
        )
        db.add(alert)
        summary = "DevOps Jumpbox (ws-ops-05) compromised; unauthorized replication probes directed toward Cold Backup Vault (srv-backup-01)."

    elif scenario_type in ("zero_trust_isolated", "isolation"):
        for a in assets:
            if a.id in ("ws-dev-04", "srv-web-01"):
                a.isolated = 1
                a.security_status = "ISOLATED"
        summary = "Autonomous Zero-Trust containment executed: ws-dev-04 and srv-web-01 isolated from network."

    else:
        summary = f"Custom scenario '{scenario_type}' executed."

    # Record scenario run
    scenario_record = SimulationScenarioRecord(
        id=f"SCEN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        name=scenario_type.upper().replace("_", " "),
        description=summary,
        scenario_type=scenario_type,
        active=1,
        payload_json=json.dumps({"summary": summary, "timestamp": datetime.now(timezone.utc).isoformat()}),
        created_at=datetime.now(timezone.utc),
    )
    db.add(scenario_record)
    db.commit()

    return {
        "status": "success",
        "scenario": scenario_type,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "topology": export_topology(db=db),
    }
