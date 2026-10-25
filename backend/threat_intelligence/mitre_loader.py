"""MITRE ATT&CK STIX Enterprise Data Loader and Parser.

Loads, validates, and normalizes MITRE ATT&CK techniques from official STIX 2.1 JSON.
Operates offline using local cache, with on-demand download capability.
"""

import logging
import urllib.request
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.threat_intelligence.cache_manager import read_json_cache, write_json_cache, cache_exists
from backend.threat_intelligence.schemas import MitreTechniqueRecord

logger = logging.getLogger("omen.threat_intelligence.mitre")

MITRE_CACHE_FILE = "mitre_attack_techniques.json"
MITRE_STIX_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"


def load_mitre_techniques(force_refresh: bool = False, timeout: int = 90) -> List[MitreTechniqueRecord]:
    """Load MITRE ATT&CK techniques from cache, fetching if absent or forced."""
    if not force_refresh and cache_exists(MITRE_CACHE_FILE):
        cached = read_json_cache(MITRE_CACHE_FILE)
        if cached and "techniques" in cached:
            return _deserialize_techniques(cached["techniques"])

    # Download from official repository
    try:
        logger.info(f"Downloading MITRE ATT&CK STIX data from {MITRE_STIX_URL}...")
        req = urllib.request.Request(
            MITRE_STIX_URL,
            headers={"User-Agent": "OMEN-ThreatIntel/2.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            stix = json.loads(resp.read().decode("utf-8"))

        raw_techniques = []
        for obj in stix.get("objects", []):
            if (
                obj.get("type") == "attack-pattern"
                and not obj.get("revoked", False)
                and not obj.get("x_mitre_deprecated", False)
            ):
                tech_id = None
                url = None
                refs = []
                for ref in obj.get("external_references", []):
                    if ref.get("source_name") == "mitre-attack":
                        tech_id = ref.get("external_id")
                        url = ref.get("url")
                    if ref.get("url"):
                        refs.append(ref["url"])

                if tech_id:
                    tactics = [
                        phase.get("phase_name")
                        for phase in obj.get("kill_chain_phases", [])
                        if phase.get("kill_chain_name") == "mitre-attack"
                    ]
                    formatted_url = url or f"https://attack.mitre.org/techniques/{tech_id.replace('.', '/')}"
                    raw_techniques.append({
                        "technique_id": tech_id,
                        "name": obj.get("name", "Unknown Technique"),
                        "description": obj.get("description", ""),
                        "tactics": tactics,
                        "platforms": obj.get("x_mitre_platforms", []),
                        "url": formatted_url,
                        "is_subtechnique": obj.get("x_mitre_is_subtechnique", False),
                        "created": obj.get("created"),
                        "modified": obj.get("modified"),
                        "detection": obj.get("x_mitre_detection", ""),
                        "references": refs[:5],
                    })

        raw_techniques.sort(key=lambda t: t["technique_id"])
        cache_payload = {
            "spec_version": stix.get("spec_version", "2.1"),
            "count": len(raw_techniques),
            "last_synced_utc": datetime.now(timezone.utc).isoformat(),
            "source": "https://github.com/mitre-attack/attack-stix-data",
            "techniques": raw_techniques,
        }
        write_json_cache(MITRE_CACHE_FILE, cache_payload)
        return _deserialize_techniques(raw_techniques)

    except Exception as e:
        logger.error(f"Failed to fetch MITRE STIX from repository: {e}")
        # Try fallback cache if available
        fallback = read_json_cache(MITRE_CACHE_FILE)
        if fallback and "techniques" in fallback:
            return _deserialize_techniques(fallback["techniques"])
        return _fallback_seed_techniques()


def _deserialize_techniques(raw_list: List[Dict[str, Any]]) -> List[MitreTechniqueRecord]:
    """Convert raw dicts into validated Pydantic records."""
    records = []
    for item in raw_list:
        tid = item.get("technique_id") or item.get("id")
        if tid:
            records.append(
                MitreTechniqueRecord(
                    technique_id=tid,
                    name=item.get("name", "Unknown"),
                    description=item.get("description", ""),
                    tactics=item.get("tactics", []),
                    platforms=item.get("platforms", []),
                    url=item.get("url", f"https://attack.mitre.org/techniques/{tid.replace('.', '/')}"),
                    is_subtechnique=item.get("is_subtechnique", False),
                    created=item.get("created"),
                    modified=item.get("modified"),
                    detection=item.get("detection"),
                    references=item.get("references", []),
                )
            )
    return records


def _fallback_seed_techniques() -> List[MitreTechniqueRecord]:
    """Minimal seed techniques for zero-network testing environments."""
    seeds = [
        {
            "technique_id": "T1190",
            "name": "Exploit Public-Facing Application",
            "tactics": ["initial-access"],
            "platforms": ["Windows", "Linux", "Network"],
            "description": "Adversary exploits vulnerabilities in Internet-facing software.",
            "url": "https://attack.mitre.org/techniques/T1190",
        },
        {
            "technique_id": "T1021.004",
            "name": "Remote Services: SSH",
            "tactics": ["lateral-movement"],
            "platforms": ["Linux", "macOS"],
            "description": "Adversary leverages SSH sessions to pivot between hosts.",
            "url": "https://attack.mitre.org/techniques/T1021/004",
        },
        {
            "technique_id": "T1021.002",
            "name": "Remote Services: SMB/Windows Admin Shares",
            "tactics": ["lateral-movement"],
            "platforms": ["Windows"],
            "description": "Adversary leverages SMB port 445 for lateral execution.",
            "url": "https://attack.mitre.org/techniques/T1021/002",
        },
        {
            "technique_id": "T1078",
            "name": "Valid Accounts",
            "tactics": ["defense-evasion", "persistence", "privilege-escalation", "initial-access"],
            "platforms": ["Windows", "Linux", "Cloud", "SaaS"],
            "description": "Adversary obtains and abuses credentials of existing accounts.",
            "url": "https://attack.mitre.org/techniques/T1078",
        },
    ]
    return _deserialize_techniques(seeds)
