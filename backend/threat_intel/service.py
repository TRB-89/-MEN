"""Threat Intelligence Service.

Loads, indexes, and queries MITRE ATT&CK STIX techniques and CISA Known Exploited
Vulnerabilities (KEV). Operates 100% offline using persisted local caches, while
supporting live on-demand synchronization with official GitHub repositories.
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("omen.threat_intel.service")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "threat_intel")


class ThreatIntelService:
    def __init__(self):
        self.is_loaded = False
        self.mitre_techniques: List[Dict[str, Any]] = []
        self.mitre_by_id: Dict[str, Dict[str, Any]] = {}
        self.mitre_by_tactic: Dict[str, List[Dict[str, Any]]] = {}

        self.cisa_vulnerabilities: List[Dict[str, Any]] = []
        self.cisa_by_cve: Dict[str, Dict[str, Any]] = {}
        self.cisa_by_vendor: Dict[str, List[Dict[str, Any]]] = {}

        self.attribution: Dict[str, Any] = {}
        self.last_synced_utc: Optional[str] = None
        self.cisa_catalog_version: Optional[str] = None
        self.mitre_spec_version: Optional[str] = None

    def initialize(self, auto_fetch: bool = True):
        """Initialize in-memory indexes from cached JSON files, fetching if absent."""
        cisa_path = os.path.join(DATA_DIR, "cisa_kev.json")
        mitre_path = os.path.join(DATA_DIR, "mitre_attack_techniques.json")
        attr_path = os.path.join(DATA_DIR, "attribution.json")

        if not (os.path.exists(cisa_path) and os.path.exists(mitre_path)):
            if auto_fetch:
                logger.info("Threat intelligence cache missing; triggering initial synchronization...")
                try:
                    from backend.threat_intel.fetch_data import sync_all_datasets
                    sync_all_datasets(force=False)
                except Exception as e:
                    logger.error(f"Automatic threat intelligence sync failed: {e}")

        # Load CISA KEV
        if os.path.exists(cisa_path):
            try:
                with open(cisa_path, "r", encoding="utf-8") as f:
                    cisa_data = json.load(f)
                self.cisa_vulnerabilities = cisa_data.get("vulnerabilities", [])
                self.cisa_catalog_version = cisa_data.get("catalog_version")
                self.last_synced_utc = cisa_data.get("last_synced_utc")
                self.cisa_by_cve = {v["cveID"].upper(): v for v in self.cisa_vulnerabilities if "cveID" in v}

                self.cisa_by_vendor.clear()
                for v in self.cisa_vulnerabilities:
                    vendor = v.get("vendorProject", "Unknown").lower()
                    self.cisa_by_vendor.setdefault(vendor, []).append(v)
            except Exception as e:
                logger.error(f"Failed to load CISA KEV cache: {e}")

        # Load MITRE ATT&CK
        if os.path.exists(mitre_path):
            try:
                with open(mitre_path, "r", encoding="utf-8") as f:
                    mitre_data = json.load(f)
                self.mitre_techniques = mitre_data.get("techniques", [])
                self.mitre_spec_version = mitre_data.get("spec_version")
                self.mitre_by_id = {t["id"].upper(): t for t in self.mitre_techniques if "id" in t}

                self.mitre_by_tactic.clear()
                for t in self.mitre_techniques:
                    for tac in t.get("tactics", []):
                        self.mitre_by_tactic.setdefault(tac.lower(), []).append(t)
            except Exception as e:
                logger.error(f"Failed to load MITRE ATT&CK cache: {e}")

        # Load attribution
        if os.path.exists(attr_path):
            try:
                with open(attr_path, "r", encoding="utf-8") as f:
                    self.attribution = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load attribution metadata: {e}")

        self.is_loaded = True
        logger.info(
            f"ThreatIntelService initialized: {len(self.mitre_techniques)} MITRE techniques, "
            f"{len(self.cisa_vulnerabilities)} CISA KEV vulnerabilities loaded into memory."
        )

    def get_summary(self) -> Dict[str, Any]:
        """Return high-level threat intelligence repository summary and attribution."""
        if not self.is_loaded:
            self.initialize(auto_fetch=False)

        tactics_summary = {k: len(v) for k, v in sorted(self.mitre_by_tactic.items())}
        ransomware_count = sum(
            1 for v in self.cisa_vulnerabilities
            if (v.get("knownRansomwareCampaignUse") or "").lower() == "known"
        )

        return {
            "status": "operational" if (self.mitre_techniques and self.cisa_vulnerabilities) else "degraded",
            "offline_ready": True,
            "mitre_attack": {
                "total_techniques": len(self.mitre_techniques),
                "tactics_count": len(self.mitre_by_tactic),
                "tactics_breakdown": tactics_summary,
                "spec_version": self.mitre_spec_version or "2.1",
                "source_repository": "https://github.com/mitre-attack/attack-stix-data",
            },
            "cisa_kev": {
                "total_vulnerabilities": len(self.cisa_vulnerabilities),
                "known_ransomware_associated": ransomware_count,
                "catalog_version": self.cisa_catalog_version or "1.0",
                "source_repository": "https://github.com/cisagov/kev-data",
            },
            "last_synced_utc": self.last_synced_utc,
            "attribution": self.attribution,
        }

    def search_mitre(
        self,
        query: Optional[str] = None,
        tactic: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Search MITRE ATT&CK techniques by keyword, ID, tactic, or platform."""
        if not self.is_loaded:
            self.initialize(auto_fetch=False)

        candidates = self.mitre_techniques

        if tactic:
            tac_key = tactic.strip().lower()
            candidates = self.mitre_by_tactic.get(tac_key, [])

        results = []
        q = (query or "").strip().lower()
        plat = (platform or "").strip().lower()

        for t in candidates:
            if plat:
                platforms = [p.lower() for p in t.get("platforms", [])]
                if plat not in platforms:
                    continue

            if q:
                tid = t.get("id", "").lower()
                name = t.get("name", "").lower()
                desc = t.get("description", "").lower()
                if q not in tid and q not in name and q not in desc:
                    continue

            results.append(t)

        total = len(results)
        paged = results[offset : offset + limit]

        return {
            "total": total,
            "count": len(paged),
            "limit": limit,
            "offset": offset,
            "query": query,
            "tactic": tactic,
            "platform": platform,
            "results": paged,
        }

    def get_mitre_technique(self, technique_id: str) -> Optional[Dict[str, Any]]:
        """Lookup specific MITRE technique by ID (e.g. T1190 or T1021.004)."""
        if not self.is_loaded:
            self.initialize(auto_fetch=False)
        return self.mitre_by_id.get(technique_id.strip().upper())

    def search_cisa_kev(
        self,
        query: Optional[str] = None,
        vendor: Optional[str] = None,
        product: Optional[str] = None,
        ransomware_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Search CISA Known Exploited Vulnerabilities by CVE, vendor, product, or keyword."""
        if not self.is_loaded:
            self.initialize(auto_fetch=False)

        candidates = self.cisa_vulnerabilities

        if vendor:
            v_key = vendor.strip().lower()
            candidates = self.cisa_by_vendor.get(v_key, [])

        results = []
        q = (query or "").strip().lower()
        prod_filter = (product or "").strip().lower()

        for v in candidates:
            if ransomware_only:
                rw = (v.get("knownRansomwareCampaignUse") or "").lower()
                if rw != "known":
                    continue

            if prod_filter:
                p_name = (v.get("product") or "").lower()
                if prod_filter not in p_name:
                    continue

            if q:
                cve = (v.get("cveID") or "").lower()
                name = (v.get("vulnerabilityName") or "").lower()
                desc = (v.get("shortDescription") or "").lower()
                v_proj = (v.get("vendorProject") or "").lower()
                p_prod = (v.get("product") or "").lower()
                if q not in cve and q not in name and q not in desc and q not in v_proj and q not in p_prod:
                    continue

            results.append(v)

        total = len(results)
        paged = results[offset : offset + limit]

        return {
            "total": total,
            "count": len(paged),
            "limit": limit,
            "offset": offset,
            "query": query,
            "vendor": vendor,
            "product": product,
            "ransomware_only": ransomware_only,
            "results": paged,
        }

    def get_cisa_kev_cve(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """Lookup specific vulnerability in CISA KEV catalog by CVE ID."""
        if not self.is_loaded:
            self.initialize(auto_fetch=False)
        return self.cisa_by_cve.get(cve_id.strip().upper())

    def match_asset_vulnerabilities(self, asset_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify verified CISA KEV entries matching explicit CVE IDs on an asset.
        
        Strict constraint: Do not invent associations or extrapolate software without evidence.
        """
        if not self.is_loaded:
            self.initialize(auto_fetch=False)

        matches: List[Dict[str, Any]] = []
        raw_vulns = asset_data.get("vulnerabilities", [])

        cve_pattern = re.compile(r"CVE-\d{4}-\d{4,7}", re.IGNORECASE)
        found_cves = set()

        # 1. Search in explicitly declared vulnerabilities
        for v in raw_vulns:
            for match in cve_pattern.findall(str(v)):
                found_cves.add(match.upper())

        # 2. Search in asset description or name if present
        for field in ("description", "notes"):
            val = asset_data.get(field)
            if val:
                for match in cve_pattern.findall(str(val)):
                    found_cves.add(match.upper())

        for cve in sorted(found_cves):
            kev_entry = self.cisa_by_cve.get(cve)
            if kev_entry:
                matches.append({
                    "cve_id": cve,
                    "matched_by": "EXPLICIT_CVE_EVIDENCE",
                    "in_cisa_kev": True,
                    "vulnerability_name": kev_entry.get("vulnerabilityName"),
                    "vendor_project": kev_entry.get("vendorProject"),
                    "product": kev_entry.get("product"),
                    "short_description": kev_entry.get("shortDescription"),
                    "date_added": kev_entry.get("dateAdded"),
                    "due_date": kev_entry.get("dueDate"),
                    "required_action": kev_entry.get("requiredAction"),
                    "known_ransomware_campaign_use": kev_entry.get("knownRansomwareCampaignUse"),
                    "notes_url": kev_entry.get("notes"),
                    "nvd_url": f"https://nvd.nist.gov/vuln/detail/{cve}",
                })
            else:
                matches.append({
                    "cve_id": cve,
                    "matched_by": "EXPLICIT_CVE_EVIDENCE",
                    "in_cisa_kev": False,
                    "vulnerability_name": "Non-cataloged or Custom CVE",
                    "nvd_url": f"https://nvd.nist.gov/vuln/detail/{cve}",
                })

        return matches


# Global singleton instance
threat_intel_service = ThreatIntelService()
