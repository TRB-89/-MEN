"""National Vulnerability Database (NVD) Data Loader.

Loads, validates, and indexes CVE records with CVSS scores, affected products,
and technical vulnerability descriptions. Operates offline using bounded local cache.
"""

import logging
import urllib.request
import json
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.threat_intelligence.cache_manager import read_json_cache, write_json_cache, cache_exists
from backend.threat_intelligence.schemas import VulnerabilityRecord

logger = logging.getLogger("omen.threat_intelligence.nvd")

NVD_CACHE_FILE = "nvd_vulnerabilities.json"
NVD_GITHUB_BASE = "https://raw.githubusercontent.com/fkie-cad/nvd-json-data-feeds/main"

# Core synthetic and high-priority enterprise CVEs pre-seeded for offline demonstration
DEFAULT_ENTERPRISE_CVES = [
    "CVE-2023-3519",   # Citrix NetScaler ADC Code Injection (RCE)
    "CVE-2024-21413",  # Microsoft Outlook Moniker Link RCE
    "CVE-2021-44228",  # Apache Log4j2 JNDI RCE (Log4Shell)
    "CVE-2023-4966",   # Citrix NetScaler Bleed Session Hijack
    "CVE-2023-20198",  # Cisco IOS XE Web UI Privilege Escalation
    "CVE-2024-3400",   # Palo Alto PAN-OS GlobalProtect Command Injection
    "CVE-2023-22515",  # Atlassian Confluence Data Center Broken Access Control
    "CVE-2023-34362",  # Progress MOVEit Transfer SQL Injection
    "CVE-2023-27997",  # Fortinet FortiOS SSL-VPN Heap Buffer Overflow
    "CVE-2024-1709",   # ConnectWise ScreenConnect Authentication Bypass
    "CVE-2023-20273",  # Cisco IOS XE Command Injection
    "CVE-2022-26134",  # Atlassian Confluence OGNL Injection
    "CVE-2021-26855",  # Microsoft Exchange Server ProxyLogon
    "CVE-2020-1472",   # Microsoft Netlogon Privilege Escalation (Zerologon)
]


def load_nvd_vulnerabilities(force_refresh: bool = False) -> Dict[str, VulnerabilityRecord]:
    """Load NVD vulnerability records from cache, fetching if absent or forced."""
    if not force_refresh and cache_exists(NVD_CACHE_FILE):
        cached = read_json_cache(NVD_CACHE_FILE)
        if cached and "vulnerabilities" in cached:
            return _deserialize_vulnerabilities(cached["vulnerabilities"])

    # Build cache from seeds and bounded fetch
    logger.info("Initializing bounded NVD vulnerability cache...")
    records_dict: Dict[str, Dict[str, Any]] = {}

    for cve in DEFAULT_ENTERPRISE_CVES:
        fetched = fetch_single_nvd_cve(cve)
        if fetched:
            records_dict[cve] = fetched

    # If network unavailable, merge with fallback seeds
    if not records_dict:
        records_dict = _fallback_seed_nvd_dict()

    cache_payload = {
        "count": len(records_dict),
        "last_synced_utc": datetime.now(timezone.utc).isoformat(),
        "source": "https://github.com/fkie-cad/nvd-json-data-feeds",
        "vulnerabilities": records_dict,
    }
    write_json_cache(NVD_CACHE_FILE, cache_payload)
    return _deserialize_vulnerabilities(records_dict)


def fetch_single_nvd_cve(cve_id: str, timeout: int = 10) -> Optional[Dict[str, Any]]:
    """Fetch an individual CVE record from NVD JSON data feeds repository."""
    cve_clean = cve_id.strip().upper()
    match = re.match(r"^CVE-(\d{4})-(\d{2})(\d{2,5})$", cve_clean)
    if not match:
        return None

    year = match.group(1)
    prefix_hundreds = match.group(2) + "xx"
    url = f"{NVD_GITHUB_BASE}/CVE-{year}/CVE-{year}-{prefix_hundreds}/{cve_clean}.json"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OMEN-ThreatIntel/2.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        cve_data = data.get("cve", data)
        metrics = cve_data.get("metrics", {})

        # Extract CVSS 3.1
        cvss31 = None
        cvss31_score = None
        cvss31_severity = "UNKNOWN"
        cvss31_vector = None
        if "cvssMetricV31" in metrics and len(metrics["cvssMetricV31"]) > 0:
            cvss31 = metrics["cvssMetricV31"][0].get("cvssData", {})
            cvss31_score = cvss31.get("baseScore")
            cvss31_severity = cvss31.get("baseSeverity", "UNKNOWN").upper()
            cvss31_vector = cvss31.get("vectorString")

        # Extract CVSS 2.0
        cvss2_score = None
        if "cvssMetricV2" in metrics and len(metrics["cvssMetricV2"]) > 0:
            cvss2 = metrics["cvssMetricV2"][0].get("cvssData", {})
            cvss2_score = cvss2.get("baseScore")
            if cvss31_severity == "UNKNOWN":
                cvss31_severity = metrics["cvssMetricV2"][0].get("baseSeverity", "UNKNOWN").upper()

        # Extract English description
        desc = "No technical description available."
        for d in cve_data.get("descriptions", []):
            if d.get("lang") == "en":
                desc = d.get("value", desc)
                break

        # Extract affected products from configurations
        products = []
        for config in cve_data.get("configurations", []):
            for node in config.get("nodes", []):
                for match_cpe in node.get("cpeMatch", []):
                    criteria = match_cpe.get("criteria", "")
                    if criteria:
                        parts = criteria.split(":")
                        if len(parts) >= 5:
                            vendor = parts[3]
                            product = parts[4]
                            entry = f"{vendor.capitalize()} {product.capitalize()}"
                            if entry not in products:
                                products.append(entry)

        refs = [r.get("url") for r in cve_data.get("references", []) if r.get("url")]

        return {
            "cve_id": cve_clean,
            "description": desc,
            "severity": cvss31_severity,
            "cvss_v3_score": cvss31_score,
            "cvss_v3_vector": cvss31_vector,
            "cvss_v2_score": cvss2_score,
            "affected_products": products[:10],
            "published_date": cve_data.get("published"),
            "modified_date": cve_data.get("lastModified"),
            "references": refs[:6],
        }

    except Exception as e:
        logger.debug(f"Could not fetch NVD record for {cve_clean}: {e}")
        return None


def _deserialize_vulnerabilities(raw_dict: Dict[str, Dict[str, Any]]) -> Dict[str, VulnerabilityRecord]:
    """Convert raw dict into Pydantic records indexed by CVE ID."""
    records = {}
    for cve, data in raw_dict.items():
        records[cve.upper()] = VulnerabilityRecord(
            cve_id=cve.upper(),
            description=data.get("description", ""),
            severity=data.get("severity", "UNKNOWN"),
            cvss_v3_score=data.get("cvss_v3_score"),
            cvss_v3_vector=data.get("cvss_v3_vector"),
            cvss_v2_score=data.get("cvss_v2_score"),
            affected_products=data.get("affected_products", []),
            published_date=data.get("published_date"),
            modified_date=data.get("modified_date"),
            references=data.get("references", []),
        )
    return records


def _fallback_seed_nvd_dict() -> Dict[str, Dict[str, Any]]:
    """Seed dictionary of verified NVD records for offline simulation."""
    return {
        "CVE-2023-3519": {
            "cve_id": "CVE-2023-3519",
            "description": "Unauthenticated remote code execution vulnerability in Citrix NetScaler ADC and NetScaler Gateway.",
            "severity": "CRITICAL",
            "cvss_v3_score": 9.8,
            "cvss_v3_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            "affected_products": ["Citrix Netscaler ADC", "Citrix Netscaler Gateway"],
            "published_date": "2023-07-19T00:15:00",
            "modified_date": "2023-07-28T14:48:00",
            "references": ["https://support.citrix.com/article/CTX561482", "https://nvd.nist.gov/vuln/detail/CVE-2023-3519"],
        },
        "CVE-2024-21413": {
            "cve_id": "CVE-2024-21413",
            "description": "Microsoft Outlook Remote Code Execution Vulnerability (Moniker Link bypass of Office Protected View).",
            "severity": "CRITICAL",
            "cvss_v3_score": 9.8,
            "cvss_v3_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            "affected_products": ["Microsoft Outlook", "Microsoft Office 365 Apps"],
            "published_date": "2024-02-13T03:15:00",
            "modified_date": "2024-02-15T18:12:00",
            "references": ["https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-21413"],
        },
        "CVE-2021-44228": {
            "cve_id": "CVE-2021-44228",
            "description": "Apache Log4j2 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.",
            "severity": "CRITICAL",
            "cvss_v3_score": 10.0,
            "cvss_v3_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
            "affected_products": ["Apache Log4j"],
            "published_date": "2021-12-10T10:15:00",
            "modified_date": "2021-12-14T21:15:00",
            "references": ["https://logging.apache.org/log4j/2.x/security.html"],
        },
    }
