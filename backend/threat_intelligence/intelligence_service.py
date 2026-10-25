"""Unified Threat Intelligence Service.

Coordinates MITRE ATT&CK STIX, NVD CVE feeds, CISA KEV catalog, and FIRST EPSS scores.
Operates 100% offline with fast in-memory indexing, supporting on-demand background sync.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import re

from backend.threat_intelligence.sources import SOURCES_METADATA, SAFETY_DISCLAIMER
from backend.threat_intelligence.schemas import (
    MitreTechniqueRecord,
    MitreQueryResponse,
    CisaKevRecord,
    EpssRecord,
    VulnerabilityRecord,
    VulnerabilityQueryResponse,
    IntelligenceStatusResponse,
)
from backend.threat_intelligence.mitre_loader import load_mitre_techniques
from backend.threat_intelligence.kev_loader import load_cisa_kev
from backend.threat_intelligence.epss_loader import load_epss_scores
from backend.threat_intelligence.nvd_loader import load_nvd_vulnerabilities, fetch_single_nvd_cve
from backend.threat_intelligence.normalizer import normalize_vulnerability_record
from backend.threat_intelligence.optional_services import get_optional_services_status

logger = logging.getLogger("omen.threat_intelligence.service")


class ThreatIntelligenceService:
    def __init__(self):
        self.is_initialized: bool = False
        self.last_synced_utc: Optional[str] = None

        # In-memory indexes
        self.mitre_records: List[MitreTechniqueRecord] = []
        self.mitre_by_id: Dict[str, MitreTechniqueRecord] = {}
        self.mitre_by_tactic: Dict[str, List[MitreTechniqueRecord]] = {}

        self.kev_records: List[CisaKevRecord] = []
        self.kev_by_cve: Dict[str, CisaKevRecord] = {}
        self.kev_by_vendor: Dict[str, List[CisaKevRecord]] = {}

        self.epss_records: Dict[str, EpssRecord] = {}

        self.nvd_records: Dict[str, VulnerabilityRecord] = {}
        self.normalized_vulnerabilities: Dict[str, VulnerabilityRecord] = {}

    def initialize(self, force_refresh: bool = False):
        """Initialize all loaders and build fast lookup indexes in memory."""
        logger.info("Initializing Unified Threat Intelligence Service...")

        # 1. Load MITRE ATT&CK techniques
        try:
            self.mitre_records = load_mitre_techniques(force_refresh=force_refresh)
            self.mitre_by_id = {t.technique_id.upper(): t for t in self.mitre_records}
            self.mitre_by_tactic.clear()
            for t in self.mitre_records:
                for tac in t.tactics:
                    self.mitre_by_tactic.setdefault(tac.lower(), []).append(t)
            logger.info(f"Loaded {len(self.mitre_records)} MITRE ATT&CK techniques.")
        except Exception as e:
            logger.error(f"Error loading MITRE ATT&CK: {e}")

        # 2. Load CISA KEV
        try:
            self.kev_records = load_cisa_kev(force_refresh=force_refresh)
            self.kev_by_cve = {k.cve_id.upper(): k for k in self.kev_records}
            self.kev_by_vendor.clear()
            for k in self.kev_records:
                v_clean = k.vendor.lower()
                self.kev_by_vendor.setdefault(v_clean, []).append(k)
            logger.info(f"Loaded {len(self.kev_records)} CISA KEV catalog vulnerabilities.")
        except Exception as e:
            logger.error(f"Error loading CISA KEV: {e}")

        # 3. Load FIRST EPSS
        try:
            self.epss_records = load_epss_scores(force_refresh=force_refresh)
            logger.info(f"Loaded {len(self.epss_records)} FIRST EPSS scores.")
        except Exception as e:
            logger.error(f"Error loading FIRST EPSS: {e}")

        # 4. Load NVD Vulnerabilities
        try:
            self.nvd_records = load_nvd_vulnerabilities(force_refresh=force_refresh)
            logger.info(f"Loaded {len(self.nvd_records)} NVD base vulnerability records.")
        except Exception as e:
            logger.error(f"Error loading NVD: {e}")

        # 5. Build Unified Normalized Vulnerabilities
        self._build_normalized_index()

        self.last_synced_utc = datetime.now(timezone.utc).isoformat()
        self.is_initialized = True
        logger.info("Unified Threat Intelligence Service ready.")

    def _build_normalized_index(self):
        """Cross-reference NVD records, CISA KEV catalog, and EPSS scores."""
        all_cves = set(self.nvd_records.keys()) | set(self.kev_by_cve.keys()) | set(self.epss_records.keys())
        self.normalized_vulnerabilities.clear()

        for cve in all_cves:
            nvd_rec = self.nvd_records.get(cve)
            kev_rec = self.kev_by_cve.get(cve)
            epss_rec = self.epss_records.get(cve)

            # Normalize and combine
            unified = normalize_vulnerability_record(
                cve_id=cve,
                nvd_record=nvd_rec,
                kev_record=kev_rec,
                epss_record=epss_rec,
            )
            self.normalized_vulnerabilities[cve] = unified

    def get_status(self) -> IntelligenceStatusResponse:
        """Return operational status and metadata for all intelligence sources."""
        if not self.is_initialized:
            self.initialize()

        counts = {
            "mitre_techniques": len(self.mitre_records),
            "cisa_kev_vulnerabilities": len(self.kev_records),
            "epss_scores": len(self.epss_records),
            "nvd_vulnerabilities": len(self.normalized_vulnerabilities),
            "known_ransomware_associated": sum(1 for k in self.kev_records if k.known_ransomware_campaign_use.lower() == "known"),
        }

        sources = {}
        for key, meta in SOURCES_METADATA.items():
            sources[key] = {
                "name": meta["name"],
                "repository": meta["repository"],
                "license": meta["license"],
                "offline_cached": meta["offline_cached"],
                "status": "LOADED" if counts.get(f"{key}_techniques", counts.get(f"{key}_vulnerabilities", 1)) > 0 else "DEGRADED",
            }

        return IntelligenceStatusResponse(
            status="operational" if self.is_initialized else "degraded",
            offline_ready=True,
            summary_counts=counts,
            sources_status=sources,
            last_synced_utc=self.last_synced_utc,
            optional_services=get_optional_services_status(),
            attribution=SOURCES_METADATA,
            disclaimer=SAFETY_DISCLAIMER,
        )

    def query_mitre(
        self,
        query: Optional[str] = None,
        tactic: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> MitreQueryResponse:
        """Search MITRE ATT&CK techniques by keyword, tactic, or platform."""
        if not self.is_initialized:
            self.initialize()

        candidates = self.mitre_records
        if tactic:
            tac_key = tactic.strip().lower()
            candidates = self.mitre_by_tactic.get(tac_key, [])

        q = (query or "").strip().lower()
        plat = (platform or "").strip().lower()
        results: List[MitreTechniqueRecord] = []

        for t in candidates:
            if plat:
                if plat not in [p.lower() for p in t.platforms]:
                    continue
            if q:
                if q not in t.technique_id.lower() and q not in t.name.lower() and q not in t.description.lower():
                    continue
            results.append(t)

        total = len(results)
        sliced = results[offset : offset + limit]

        return MitreQueryResponse(
            total=total,
            count=len(sliced),
            limit=limit,
            offset=offset,
            query=query,
            tactic=tactic,
            platform=platform,
            techniques=sliced,
        )

    def get_mitre_technique(self, technique_id: str) -> Optional[MitreTechniqueRecord]:
        """Lookup specific MITRE technique by ID (e.g. T1190 or T1021.004)."""
        if not self.is_initialized:
            self.initialize()
        return self.mitre_by_id.get(technique_id.strip().upper())

    def query_vulnerabilities(
        self,
        query: Optional[str] = None,
        severity: Optional[str] = None,
        kev_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> VulnerabilityQueryResponse:
        """Search unified vulnerability catalog with CVSS, KEV, and EPSS metrics."""
        if not self.is_initialized:
            self.initialize()

        q = (query or "").strip().lower()
        sev_filter = (severity or "").strip().upper()
        results: List[VulnerabilityRecord] = []

        for v in self.normalized_vulnerabilities.values():
            if kev_only and not v.in_cisa_kev:
                continue
            if sev_filter and v.severity != sev_filter:
                continue
            if q:
                matches_cve = q in v.cve_id.lower()
                matches_desc = q in v.description.lower()
                matches_prod = any(q in p.lower() for p in v.affected_products)
                if not (matches_cve or matches_desc or matches_prod):
                    continue
            results.append(v)

        total = len(results)
        sliced = results[offset : offset + limit]

        return VulnerabilityQueryResponse(
            total=total,
            count=len(sliced),
            limit=limit,
            offset=offset,
            query=query,
            severity=severity,
            kev_only=kev_only,
            vulnerabilities=sliced,
        )

    def get_vulnerability(self, cve_id: str) -> Optional[VulnerabilityRecord]:
        """Lookup normalized vulnerability record by CVE ID."""
        if not self.is_initialized:
            self.initialize()
        clean = cve_id.strip().upper()
        if clean not in self.normalized_vulnerabilities:
            # Check if we can fetch on-demand from NVD
            fetched = fetch_single_nvd_cve(clean)
            if fetched:
                kev = self.kev_by_cve.get(clean)
                epss = self.epss_records.get(clean)
                nvd_rec = VulnerabilityRecord(**fetched)
                self.normalized_vulnerabilities[clean] = normalize_vulnerability_record(clean, nvd_rec, kev, epss)
        return self.normalized_vulnerabilities.get(clean)

    def get_cisa_kev_record(self, cve_id: str) -> Optional[CisaKevRecord]:
        """Lookup specific CISA KEV catalog entry."""
        if not self.is_initialized:
            self.initialize()
        return self.kev_by_cve.get(cve_id.strip().upper())

    def get_epss_record(self, cve_id: str) -> Optional[EpssRecord]:
        """Lookup specific FIRST EPSS score record."""
        if not self.is_initialized:
            self.initialize()
        return self.epss_records.get(cve_id.strip().upper())

    def match_asset_vulnerabilities(self, asset_dict: Dict[str, Any]) -> List[VulnerabilityRecord]:
        """Match explicitly documented CVEs on a network asset against unified intelligence.
        
        Enforces defensive integrity: Never synthesizes or hallucinates CVE associations
        without explicit CVE ID evidence in asset records.
        """
        if not self.is_initialized:
            self.initialize()

        cve_pattern = re.compile(r"CVE-\d{4}-\d{4,7}", re.IGNORECASE)
        found_cves = set()

        for field in ("vulnerabilities", "description", "notes"):
            val = asset_dict.get(field)
            if val:
                if isinstance(val, list):
                    for item in val:
                        for match in cve_pattern.findall(str(item)):
                            found_cves.add(match.upper())
                else:
                    for match in cve_pattern.findall(str(val)):
                        found_cves.add(match.upper())

        matches: List[VulnerabilityRecord] = []
        for cve in sorted(found_cves):
            rec = self.get_vulnerability(cve)
            if rec:
                matches.append(rec)
            else:
                matches.append(
                    VulnerabilityRecord(
                        cve_id=cve,
                        description="Documented CVE reference on enterprise asset.",
                        severity="UNKNOWN",
                    )
                )

        return matches


# Global singleton instance
intelligence_service = ThreatIntelligenceService()
