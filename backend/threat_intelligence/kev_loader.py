"""CISA Known Exploited Vulnerabilities (KEV) Catalog Loader.

Loads, validates, and indexes official KEV catalog records from CISA.
Identifies vulnerabilities actively exploited in the wild and ransomware campaigns.
"""

import logging
import urllib.request
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

from backend.threat_intelligence.cache_manager import read_json_cache, write_json_cache, cache_exists
from backend.threat_intelligence.schemas import CisaKevRecord

logger = logging.getLogger("omen.threat_intelligence.kev")

KEV_CACHE_FILE = "cisa_kev.json"
KEV_URL = "https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json"


def load_cisa_kev(force_refresh: bool = False, timeout: int = 45) -> List[CisaKevRecord]:
    """Load CISA KEV catalog records from cache, fetching if absent or forced."""
    if not force_refresh and cache_exists(KEV_CACHE_FILE):
        cached = read_json_cache(KEV_CACHE_FILE)
        if cached and "vulnerabilities" in cached:
            return _deserialize_kev(cached["vulnerabilities"])

    # Download from official repository
    try:
        logger.info(f"Downloading CISA KEV catalog from {KEV_URL}...")
        req = urllib.request.Request(
            KEV_URL,
            headers={"User-Agent": "OMEN-ThreatIntel/2.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        raw_vulns = raw.get("vulnerabilities", [])
        cache_payload = {
            "catalog_version": raw.get("catalogVersion", "1.0"),
            "date_released": raw.get("dateReleased"),
            "count": len(raw_vulns),
            "last_synced_utc": datetime.now(timezone.utc).isoformat(),
            "source": "https://github.com/cisagov/kev-data",
            "vulnerabilities": raw_vulns,
        }
        write_json_cache(KEV_CACHE_FILE, cache_payload)
        return _deserialize_kev(raw_vulns)

    except Exception as e:
        logger.error(f"Failed to fetch CISA KEV from repository: {e}")
        fallback = read_json_cache(KEV_CACHE_FILE)
        if fallback and "vulnerabilities" in fallback:
            return _deserialize_kev(fallback["vulnerabilities"])
        return _fallback_seed_kev()


def _deserialize_kev(raw_list: List[Dict[str, Any]]) -> List[CisaKevRecord]:
    """Convert raw dicts into validated Pydantic records."""
    records = []
    for item in raw_list:
        cve = item.get("cveID") or item.get("cve_id")
        if cve:
            records.append(
                CisaKevRecord(
                    cve_id=cve.upper(),
                    vendor=item.get("vendorProject") or item.get("vendor", "Unknown"),
                    product=item.get("product", "Unknown"),
                    vulnerability_name=item.get("vulnerabilityName") or item.get("vulnerability_name", "Known Exploited Vulnerability"),
                    date_added=item.get("dateAdded") or item.get("date_added", "2023-01-01"),
                    required_action=item.get("requiredAction") or item.get("required_action", "Apply vendor updates immediately."),
                    due_date=item.get("dueDate") or item.get("due_date"),
                    known_ransomware_campaign_use=item.get("knownRansomwareCampaignUse") or item.get("known_ransomware_campaign_use", "Unknown"),
                    notes=item.get("notes"),
                    nvd_url=f"https://nvd.nist.gov/vuln/detail/{cve.upper()}",
                )
            )
    return records


def _fallback_seed_kev() -> List[CisaKevRecord]:
    """Minimal seed KEV records for zero-network testing environments."""
    seeds = [
        {
            "cveID": "CVE-2023-3519",
            "vendorProject": "Citrix",
            "product": "NetScaler ADC and Gateway",
            "vulnerabilityName": "Citrix NetScaler ADC/Gateway Code Injection Vulnerability",
            "dateAdded": "2023-07-19",
            "requiredAction": "Apply vendor security bulletin updates.",
            "knownRansomwareCampaignUse": "Known",
        },
        {
            "cveID": "CVE-2024-21413",
            "vendorProject": "Microsoft",
            "product": "Outlook",
            "vulnerabilityName": "Microsoft Outlook Remote Code Execution Vulnerability",
            "dateAdded": "2025-02-06",
            "requiredAction": "Apply vendor security update or disable preview pane.",
            "knownRansomwareCampaignUse": "Unknown",
        },
    ]
    return _deserialize_kev(seeds)
