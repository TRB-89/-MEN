"""Business and Operational Disruption Impact Analysis Engine.

Quantifies the collateral operational cost of defensive containment strategies,
identifying disrupted legitimate business workflows, affected departments, and estimated downtime.
"""

from typing import Dict, List, Any, Optional
import networkx as nx
from backend.defense.schemas import BusinessImpactAnalysis, DefenseActionType

BUSINESS_SERVICES_MAP = {
    "ws-dev-04": ("DevOps CI/CD Pipeline & GitHub Sync", "Engineering", 15.0),
    "ws-ops-05": ("Kubernetes Cluster Orchestration & Jumpbox", "DevOps", 20.0),
    "ws-admin-01": ("SecOps Identity & Tier-0 Privileged Management", "Security Operations", 30.0),
    "ws-fin-03": ("ERP & Electronic Wire Clearing", "Finance", 60.0),
    "ws-hr-02": ("Payroll & Human Resources Terminal", "HR", 15.0),
    "srv-web-01": ("Public Customer Web Portal", "Production E-Commerce", 120.0),
    "srv-proxy-01": ("Reverse Proxy & TLS Terminator", "Infrastructure", 90.0),
    "sw-core-01": ("Core Campus VLAN Backbone", "Global IT", 180.0),
    "dc-01": ("Active Directory Kerberos Authentication", "Identity Services", 240.0),
    "srv-dns-01": ("Internal DNS / DHCP Authority", "Networking", 120.0),
    "db-prod-01": ("Core SQL Transaction Database", "Core Business", 300.0),
}


def analyze_business_impact(
    action_type: str,
    target_entity: str,
    G_before: nx.DiGraph,
    G_after: nx.DiGraph,
) -> BusinessImpactAnalysis:
    """Analyze collateral business disruption resulting from a defensive action."""
    disrupted_services: List[str] = []
    affected_depts: List[str] = []
    estimated_downtime = 0.0

    if action_type == DefenseActionType.WORKSTATION_ISOLATION:
        node_id = target_entity
        if node_id in BUSINESS_SERVICES_MAP:
            svc, dept, mins = BUSINESS_SERVICES_MAP[node_id]
            disrupted_services.append(svc)
            affected_depts.append(dept)
            estimated_downtime += mins
        else:
            disrupted_services.append(f"Local network access for {node_id}")
            affected_depts.append("Corporate Users")
            estimated_downtime += 15.0

    elif action_type == DefenseActionType.CONNECTION_RESTRICTION:
        if "->" in target_entity:
            u, v = target_entity.split("->", 1)
            u_name = G_before.nodes.get(u, {}).get("name", u)
            v_name = G_before.nodes.get(v, {}).get("name", v)
            disrupted_services.append(f"Direct lateral protocol channel: {u_name} to {v_name}")
            affected_depts.append("Engineering / System Operations")
            estimated_downtime += 10.0

    elif action_type == DefenseActionType.SESSION_REVOCATION:
        disrupted_services.append("Active Kerberos service tickets / cached tokens")
        affected_depts.append("Administrators (Re-authentication required)")
        estimated_downtime += 2.0

    elif action_type == DefenseActionType.ENHANCED_MONITORING:
        # Zero legitimate disruption
        disrupted_services = []
        affected_depts = []
        estimated_downtime = 0.0

    # Maintained critical functions
    maintained: List[str] = []
    if "db-prod-01" in G_after and G_after.in_degree("db-prod-01") > 0:
        maintained.append("Core SQL Transaction Processing remains online")
    if "srv-web-01" in G_after and G_after.nodes["srv-web-01"].get("security_status") != "ISOLATED":
        maintained.append("Customer-facing web portal availability preserved")
    if "dc-01" in G_after and not G_after.nodes["dc-01"].get("isolated", False):
        maintained.append("Domain directory services and Kerberos KDC functional")

    operational_friction = (
        "CRITICAL" if estimated_downtime > 90
        else "HIGH" if estimated_downtime > 45
        else "MODERATE" if estimated_downtime > 15
        else "MINIMAL" if estimated_downtime > 0
        else "NONE"
    )

    return BusinessImpactAnalysis(
        disrupted_legitimate_services=disrupted_services,
        affected_departments=list(set(affected_depts)),
        estimated_downtime_minutes=estimated_downtime,
        operational_friction=operational_friction,
        critical_business_functions_maintained=maintained,
    )
