"""Local MITRE ATT&CK Knowledge Base and Technique Mapping Engine.

Provides offline, explainable technique resolution mapping observed network transitions,
service ports, protocols, and neural detection alerts to MITRE ATT&CK framework tactics.
"""

from typing import Dict, Any, Optional, Tuple

MITRE_TECHNIQUES: Dict[str, Dict[str, Any]] = {
    "T1190": {
        "id": "T1190",
        "name": "Exploit Public-Facing Application",
        "tactic": "Initial Access",
        "description": "Adversary exploits vulnerabilities in an Internet-facing software service or web interface to gain initial execution.",
        "mitigation": "Apply timely security patches to perimeter daemons, enforce WAF filtering, and isolate public services in dedicated DMZ segments.",
    },
    "T1071.001": {
        "id": "T1071.001",
        "name": "Web Protocols (HTTP/HTTPS Ingress)",
        "tactic": "Command and Control",
        "description": "Adversary communicates using application-layer web protocols to blend in with normal network traffic.",
        "mitigation": "Enforce deep packet TLS inspection, strict reverse proxy header validation, and behavioral proxy anomaly detection.",
    },
    "T1046": {
        "id": "T1046",
        "name": "Network Service Discovery",
        "tactic": "Discovery",
        "description": "Adversary attempts to probe services and open ports on host systems to identify lateral movement pathways.",
        "mitigation": "Deploy microsegmentation ACLs, drop internal broadcast/multicast scanning probes, and alert on SYN scan spikes.",
    },
    "T1021.004": {
        "id": "T1021.004",
        "name": "SSH Lateral Tunneling",
        "tactic": "Lateral Movement",
        "description": "Adversary pivots across internal hosts using valid or stolen SSH credentials and remote tunneling.",
        "mitigation": "Require hardware-backed MFA for jump hosts, disable password authentication, and restrict internal SSH egress to Tier-0 management bastions.",
    },
    "T1021.002": {
        "id": "T1021.002",
        "name": "SMB / Windows Admin Shares",
        "tactic": "Lateral Movement",
        "description": "Adversary leverages Server Message Block (SMB/RPC) port 445 to execute code or transfer payloads between workstations.",
        "mitigation": "Block TCP 445 between workstation subnets, disable SMBv1, and enforce SMB signing and encryption.",
    },
    "T1021.001": {
        "id": "T1021.001",
        "name": "Remote Desktop Protocol (RDP)",
        "tactic": "Lateral Movement",
        "description": "Adversary connects to interactive graphical sessions on intermediate hosts using stolen credentials.",
        "mitigation": "Mandate Network Level Authentication (NLA), restrict RDP port 3389 to dedicated SecOps jumpboxes, and monitor simultaneous user sessions.",
    },
    "T1078.002": {
        "id": "T1078.002",
        "name": "Domain Accounts Privilege Escalation",
        "tactic": "Privilege Escalation",
        "description": "Adversary obtains credentials for domain administrative accounts to elevate privileges across security boundaries.",
        "mitigation": "Enforce Tiered Administration Architecture (Tier-0, Tier-1, Tier-2 separation), eliminate local admin password reuse with LAPS.",
    },
    "T1003.003": {
        "id": "T1003.003",
        "name": "OS Credential Dumping: NTDS.dit",
        "tactic": "Credential Access",
        "description": "Adversary attempts to extract Active Directory database secrets from domain controllers to compromise all domain identities.",
        "mitigation": "Isolate Domain Controllers in dedicated restricted security zones with strict IP allowlisting and RPC firewall filtering.",
    },
    "T1558.003": {
        "id": "T1558.003",
        "name": "Kerberoasting (TGS Request Probe)",
        "tactic": "Credential Access",
        "description": "Adversary requests Service Principal Name (SPN) tickets from Kerberos to crack service account hashes offline.",
        "mitigation": "Use 25+ character complex passwords or Group Managed Service Accounts (gMSA) for all service accounts.",
    },
    "T1078": {
        "id": "T1078",
        "name": "Valid Accounts / DBA Ingress",
        "tactic": "Defense Evasion",
        "description": "Adversary uses legitimate credentials to gain access to production SQL databases, bypassing conventional perimeter defenses.",
        "mitigation": "Restrict direct database port access (TCP 1433/5432) exclusively to authenticated application middle-tier services.",
    },
    "T1486": {
        "id": "T1486",
        "name": "Data Encrypted for Impact / Exfiltration",
        "tactic": "Impact",
        "description": "Adversary targets enterprise backup and storage repositories to corrupt disaster recovery images or exfiltrate crown-jewel data.",
        "mitigation": "Enforce immutable offline air-gapped backups, separate management credentials, and egress data loss prevention (DLP).",
    },
    "T1059": {
        "id": "T1059",
        "name": "Command and Scripting Interpreter",
        "tactic": "Execution",
        "description": "Adversary executes malicious commands through command line shells (Bash/PowerShell) to stage lateral movement.",
        "mitigation": "Enable script block logging, enforce constrained language mode, and deploy application control policies.",
    },
}

# Known edge-pair mappings for specific synthetic enterprise transitions
EDGE_TECHNIQUE_MAP: Dict[Tuple[str, str], str] = {
    ("gw-ext-01", "fw-dmz-01"): "T1190",
    ("fw-dmz-01", "srv-web-01"): "T1190",
    ("fw-dmz-01", "srv-proxy-01"): "T1071.001",
    ("srv-web-01", "sw-core-01"): "T1046",
    ("srv-web-01", "ws-dev-04"): "T1021.004",
    ("ws-dev-04", "sw-core-01"): "T1021.002",
    ("ws-dev-04", "ws-ops-05"): "T1021.002",
    ("ws-dev-04", "ws-admin-01"): "T1078.002",
    ("ws-ops-05", "ws-fin-03"): "T1021.001",
    ("ws-admin-01", "dc-01"): "T1003.003",
    ("ws-admin-01", "db-prod-01"): "T1078",
    ("sw-core-01", "dc-01"): "T1558.003",
    ("sw-core-01", "db-prod-01"): "T1190",
    ("dc-01", "db-prod-01"): "T1078",
    ("db-prod-01", "srv-backup-01"): "T1486",
}


def resolve_mitre_technique(
    from_node: str,
    to_node: str,
    protocol: str = "TCP",
    port: int = 0,
    detected_attack_cat: Optional[str] = None,
) -> Dict[str, Any]:
    """Resolve the most accurate MITRE ATT&CK technique for a network hop."""
    # 1. Exact edge match in enterprise knowledge base
    technique_id = EDGE_TECHNIQUE_MAP.get((from_node, to_node))

    # 2. Heuristic resolution by port and protocol
    if not technique_id:
        if port in (80, 443, 8080, 8443) or "HTTP" in protocol.upper():
            technique_id = "T1071.001"
        elif port in (22,) or "SSH" in protocol.upper():
            technique_id = "T1021.004"
        elif port in (445, 139) or "SMB" in protocol.upper():
            technique_id = "T1021.002"
        elif port in (3389,) or "RDP" in protocol.upper():
            technique_id = "T1021.001"
        elif port in (88, 389, 636) or "KERBEROS" in protocol.upper() or "LDAP" in protocol.upper():
            technique_id = "T1558.003"
        elif port in (1433, 5432, 3306, 1521) or "SQL" in protocol.upper():
            technique_id = "T1078"
        elif "SCAN" in (detected_attack_cat or "").upper() or "RECON" in (detected_attack_cat or "").upper():
            technique_id = "T1046"
        elif "EXPLOIT" in (detected_attack_cat or "").upper():
            technique_id = "T1190"
        else:
            technique_id = "T1021.002"

    # Query ThreatIntelService for official MITRE ATT&CK STIX details
    official = None
    try:
        from backend.threat_intel.service import threat_intel_service
        official = threat_intel_service.get_mitre_technique(technique_id)
    except Exception:
        pass

    if official:
        tactic_str = ", ".join(t.replace("-", " ").title() for t in official.get("tactics", [])) or "Lateral Movement"
        return {
            "id": official["id"],
            "name": official["name"],
            "tactic": tactic_str,
            "description": official.get("description", ""),
            "mitigation": MITRE_TECHNIQUES.get(technique_id, {}).get("mitigation", "Implement targeted segment isolation, microsegmentation, and egress filtering."),
            "url": official.get("url", f"https://attack.mitre.org/techniques/{technique_id.replace('.', '/')}"),
            "platforms": official.get("platforms", []),
            "source": "MITRE ATT&CK® Enterprise STIX",
        }

    return MITRE_TECHNIQUES.get(
        technique_id,
        {
            "id": technique_id,
            "name": f"Lateral Pivot via {protocol}/{port}",
            "tactic": "Lateral Movement",
            "description": f"Adversary utilizes authorized network route across {protocol} port {port} to advance position.",
            "mitigation": "Enforce strict host-based firewalling and monitor unexpected inter-segment connection initiations.",
            "url": f"https://attack.mitre.org/techniques/{technique_id.replace('.', '/')}",
            "platforms": ["Network"],
            "source": "Static Knowledge Base Fallback",
        },
    )
