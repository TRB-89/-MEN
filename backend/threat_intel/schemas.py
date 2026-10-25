"""Pydantic schemas for Threat Intelligence API."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MitreTechnique(BaseModel):
    id: str = Field(..., description="Technique ID (e.g. T1190, T1021.004)")
    name: str = Field(..., description="Technique Title")
    description: str = Field(default="", description="Detailed technical description")
    tactics: List[str] = Field(default_factory=list, description="Kill-chain tactics")
    platforms: List[str] = Field(default_factory=list, description="Target platforms")
    url: str = Field(..., description="Official MITRE ATT&CK link")
    is_subtechnique: bool = Field(default=False)
    created: Optional[str] = None
    modified: Optional[str] = None
    detection: Optional[str] = None


class MitreSearchResponse(BaseModel):
    total: int
    count: int
    limit: int
    offset: int
    query: Optional[str] = None
    tactic: Optional[str] = None
    platform: Optional[str] = None
    results: List[MitreTechnique]


class CisaKevVulnerability(BaseModel):
    cveID: str = Field(..., description="CVE identifier (e.g. CVE-2023-3519)")
    vendorProject: str = Field(..., description="Software vendor or open-source project")
    product: str = Field(..., description="Vulnerable product name")
    vulnerabilityName: str = Field(..., description="Official title of the vulnerability")
    dateAdded: str = Field(..., description="Date added to CISA KEV catalog")
    shortDescription: str = Field(..., description="Summary of the vulnerability and exploitation impact")
    requiredAction: str = Field(..., description="Mitigation guidance mandated by CISA")
    dueDate: Optional[str] = None
    knownRansomwareCampaignUse: Optional[str] = None
    forensicTriage: Optional[str] = None
    notes: Optional[str] = None
    cwes: Optional[List[str]] = None


class CisaKevSearchResponse(BaseModel):
    total: int
    count: int
    limit: int
    offset: int
    query: Optional[str] = None
    vendor: Optional[str] = None
    product: Optional[str] = None
    ransomware_only: bool = False
    results: List[CisaKevVulnerability]


class ThreatIntelSummaryResponse(BaseModel):
    status: str
    offline_ready: bool
    mitre_attack: Dict[str, Any]
    cisa_kev: Dict[str, Any]
    last_synced_utc: Optional[str] = None
    attribution: Dict[str, Any]


class AssetVulnMatch(BaseModel):
    cve_id: str
    matched_by: str
    in_cisa_kev: bool
    vulnerability_name: Optional[str] = None
    vendor_project: Optional[str] = None
    product: Optional[str] = None
    short_description: Optional[str] = None
    date_added: Optional[str] = None
    due_date: Optional[str] = None
    required_action: Optional[str] = None
    known_ransomware_campaign_use: Optional[str] = None
    notes_url: Optional[str] = None
    nvd_url: str


class AssetVulnEnrichmentResponse(BaseModel):
    asset_id: str
    asset_name: str
    vulnerabilities_count: int
    cisa_kev_matches_count: int
    matches: List[AssetVulnMatch]
    attribution_notice: str
