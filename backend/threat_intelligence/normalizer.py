"""Threat Intelligence Normalizer.

Synthesizes NVD vulnerability metrics, CISA KEV exploitation flags, and FIRST EPSS
likelihood probabilities into unified, explainable threat intelligence models.
"""

from typing import Dict, Optional, Any
from backend.threat_intelligence.schemas import VulnerabilityRecord, CisaKevRecord, EpssRecord


def normalize_vulnerability_record(
    cve_id: str,
    nvd_record: Optional[VulnerabilityRecord] = None,
    kev_record: Optional[CisaKevRecord] = None,
    epss_record: Optional[EpssRecord] = None,
) -> VulnerabilityRecord:
    """Combine data from NVD, CISA KEV, and FIRST EPSS for a single CVE ID."""
    clean_cve = cve_id.strip().upper()

    # Base description and severity from NVD if available, else from KEV
    desc = "Known vulnerability record."
    severity = "UNKNOWN"
    cvss3_score = None
    cvss3_vector = None
    cvss2_score = None
    affected = []
    published = None
    modified = None
    refs = []

    if nvd_record:
        desc = nvd_record.description or desc
        severity = nvd_record.severity or severity
        cvss3_score = nvd_record.cvss_v3_score
        cvss3_vector = nvd_record.cvss_v3_vector
        cvss2_score = nvd_record.cvss_v2_score
        affected = nvd_record.affected_products or []
        published = nvd_record.published_date
        modified = nvd_record.modified_date
        refs = list(nvd_record.references or [])

    if kev_record:
        if desc == "Known vulnerability record." and kev_record.vulnerability_name:
            desc = f"{kev_record.vendor} {kev_record.product}: {kev_record.vulnerability_name}"
        if not affected:
            affected = [f"{kev_record.vendor} {kev_record.product}"]
        if kev_record.notes and kev_record.notes not in refs:
            refs.append(kev_record.notes)
        if kev_record.nvd_url and kev_record.nvd_url not in refs:
            refs.append(kev_record.nvd_url)

    # Determine KEV status
    in_kev = kev_record is not None
    cisa_action = kev_record.required_action if kev_record else None
    cisa_due = kev_record.due_date if kev_record else None
    known_rw = (
        (kev_record.known_ransomware_campaign_use or "").lower() == "known"
        if kev_record else False
    )

    # If CVSS score is missing but listed in KEV, elevate severity to at least HIGH
    if in_kev and severity == "UNKNOWN":
        severity = "HIGH"

    return VulnerabilityRecord(
        cve_id=clean_cve,
        description=desc,
        severity=severity,
        cvss_v3_score=cvss3_score,
        cvss_v3_vector=cvss3_vector,
        cvss_v2_score=cvss2_score,
        affected_products=affected,
        published_date=published,
        modified_date=modified,
        references=refs[:8],
        in_cisa_kev=in_kev,
        cisa_action=cisa_action,
        cisa_due_date=cisa_due,
        known_ransomware=known_rw,
        epss=epss_record,
    )
