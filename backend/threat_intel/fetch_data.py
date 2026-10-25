"""Threat Intelligence Data Fetcher and Offline Parser.

Downloads MITRE ATT&CK STIX JSON and CISA Known Exploited Vulnerabilities (KEV)
from official public GitHub repositories, transforms them into lightweight structured
records, and caches them locally for 100% offline ØMEN operation.
"""

import os
import json
import logging
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Any, List

logger = logging.getLogger("omen.threat_intel.fetcher")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "threat_intel")
CISA_KEV_URL = "https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json"
MITRE_ATTACK_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"


def ensure_data_dir() -> str:
    """Ensure data/threat_intel cache directory exists."""
    os.makedirs(DATA_DIR, exist_ok=True)
    return DATA_DIR


def fetch_cisa_kev(timeout: int = 45) -> Dict[str, Any]:
    """Fetch CISA KEV JSON from official GitHub repo and return structured cache dict."""
    ensure_data_dir()
    cache_file = os.path.join(DATA_DIR, "cisa_kev.json")
    logger.info("Fetching CISA KEV catalog from official repository...")

    req = urllib.request.Request(
        CISA_KEV_URL,
        headers={"User-Agent": "OMEN-Cybersecurity-OS/1.0 (Threat-Intel-Fetcher)"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    vulnerabilities = raw.get("vulnerabilities", [])
    cache = {
        "catalog_version": raw.get("catalogVersion", "1.0"),
        "date_released": raw.get("dateReleased"),
        "count": len(vulnerabilities),
        "last_synced_utc": datetime.now(timezone.utc).isoformat(),
        "source": "https://github.com/cisagov/kev-data",
        "vulnerabilities": vulnerabilities,
    }

    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

    logger.info(f"CISA KEV cached successfully: {len(vulnerabilities)} vulnerabilities saved.")
    return cache


def fetch_mitre_attack(timeout: int = 120) -> Dict[str, Any]:
    """Fetch MITRE Enterprise ATT&CK STIX JSON from GitHub, extract techniques, and cache locally."""
    ensure_data_dir()
    cache_file = os.path.join(DATA_DIR, "mitre_attack_techniques.json")
    logger.info("Fetching MITRE ATT&CK STIX data from official repository...")

    req = urllib.request.Request(
        MITRE_ATTACK_URL,
        headers={"User-Agent": "OMEN-Cybersecurity-OS/1.0 (Threat-Intel-Fetcher)"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        stix = json.loads(resp.read().decode("utf-8"))

    techniques: List[Dict[str, Any]] = []
    for obj in stix.get("objects", []):
        if obj.get("type") == "attack-pattern" and not obj.get("revoked", False) and not obj.get("x_mitre_deprecated", False):
            tech_id = None
            url = None
            for ref in obj.get("external_references", []):
                if ref.get("source_name") == "mitre-attack":
                    tech_id = ref.get("external_id")
                    url = ref.get("url")
                    break

            if tech_id:
                tactics = [
                    phase.get("phase_name")
                    for phase in obj.get("kill_chain_phases", [])
                    if phase.get("kill_chain_name") == "mitre-attack"
                ]
                formatted_url = url or f"https://attack.mitre.org/techniques/{tech_id.replace('.', '/')}"
                techniques.append({
                    "id": tech_id,
                    "name": obj.get("name"),
                    "description": obj.get("description", ""),
                    "tactics": tactics,
                    "platforms": obj.get("x_mitre_platforms", []),
                    "url": formatted_url,
                    "is_subtechnique": obj.get("x_mitre_is_subtechnique", False),
                    "created": obj.get("created"),
                    "modified": obj.get("modified"),
                    "detection": obj.get("x_mitre_detection", ""),
                })

    techniques.sort(key=lambda t: t["id"])
    cache = {
        "spec_version": stix.get("spec_version", "2.1"),
        "count": len(techniques),
        "last_synced_utc": datetime.now(timezone.utc).isoformat(),
        "source": "https://github.com/mitre-attack/attack-stix-data",
        "techniques": techniques,
    }

    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

    logger.info(f"MITRE ATT&CK cached successfully: {len(techniques)} techniques extracted.")
    return cache


def write_attribution_metadata() -> Dict[str, Any]:
    """Write official license, terms of use, and attribution metadata."""
    ensure_data_dir()
    attr_file = os.path.join(DATA_DIR, "attribution.json")
    attribution = {
        "mitre_attack": {
            "name": "MITRE ATT&CK® Enterprise Matrix",
            "repository": "https://github.com/mitre-attack/attack-stix-data",
            "license": "Apache-2.0 / CC-BY-4.0",
            "copyright": "© 2025 The MITRE Corporation.",
            "attribution_notice": "This work contains content from MITRE ATT&CK®, reproduced and distributed with permission of The MITRE Corporation under the Apache 2.0 license. MITRE ATT&CK and ATT&CK are registered trademarks of The MITRE Corporation.",
            "home_url": "https://attack.mitre.org/",
        },
        "cisa_kev": {
            "name": "CISA Known Exploited Vulnerabilities (KEV) Catalog",
            "repository": "https://github.com/cisagov/kev-data",
            "license": "CC0 1.0 Universal / Public Domain (U.S. Government Work 17 U.S.C. § 105)",
            "copyright": "U.S. Cybersecurity and Infrastructure Security Agency (CISA)",
            "attribution_notice": "Source: Cybersecurity and Infrastructure Security Agency (CISA) Known Exploited Vulnerabilities Catalog. Public domain government data provided as a defensive cybersecurity utility.",
            "home_url": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        },
        "disclaimer": "ØMEN utilizes threat intelligence data solely for defensive correlation, educational risk analysis, and simulation. ATT&CK techniques reflect empirical tactics and must not be interpreted as absolute attack probabilities. CVE references represent vulnerability metadata and are only correlated to assets when matching software evidence is available.",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
    }
    with open(attr_file, "w", encoding="utf-8") as f:
        json.dump(attribution, f, indent=2)
    return attribution


def sync_all_datasets(force: bool = False) -> Dict[str, Any]:
    """Sync both datasets if missing or forced."""
    ensure_data_dir()
    cisa_path = os.path.join(DATA_DIR, "cisa_kev.json")
    mitre_path = os.path.join(DATA_DIR, "mitre_attack_techniques.json")

    cisa_data = None
    mitre_data = None

    if force or not os.path.exists(cisa_path):
        cisa_data = fetch_cisa_kev()
    else:
        with open(cisa_path, "r", encoding="utf-8") as f:
            cisa_data = json.load(f)

    if force or not os.path.exists(mitre_path):
        mitre_data = fetch_mitre_attack()
    else:
        with open(mitre_path, "r", encoding="utf-8") as f:
            mitre_data = json.load(f)

    attr = write_attribution_metadata()

    return {
        "status": "synchronized",
        "cisa_kev_count": cisa_data.get("count", 0),
        "mitre_techniques_count": mitre_data.get("count", 0),
        "last_synced_utc": datetime.now(timezone.utc).isoformat(),
        "attribution": attr,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Initiating full threat intelligence synchronization...")
    res = sync_all_datasets(force=True)
    print("Sync complete:", res)
