"""Pydantic data models and schemas for Threat Intelligence API."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class MitreTechniqueRecord(BaseModel):
    technique_id: str = Field(..., description="Technique ID (e.g. T1190, T1021.004)")
    name: str = Field(..., description="Technique Title")
    description: str = Field(default="", description="Detailed technical description")
    tactics: List[str] = Field(default_factory=list, description="Kill-chain tactics")
    platforms: List[str] = Field(default_factory=list, description="Target platforms")
    url: str = Field(..., description="Official MITRE ATT&CK reference link")
    is_subtechnique: bool = Field(default=False)
    created: Optional[str] = None
    modified: Optional[str] = None
    detection: Optional[str] = None
    references: List[str] = Field(default_factory=list)


class MitreQueryResponse(BaseModel):
    total: int
    count: int
    limit: int
    offset: int
    query: Optional[str] = None
    tactic: Optional[str] = None
    platform: Optional[str] = None
    techniques: List[MitreTechniqueRecord]


class CisaKevRecord(BaseModel):
    cve_id: str
    vendor: str
    product: str
    vulnerability_name: str
    date_added: str
    required_action: str
    due_date: Optional[str] = None
    known_ransomware_campaign_use: Optional[str] = "Unknown"
    notes: Optional[str] = None
    nvd_url: str


class EpssRecord(BaseModel):
    cve_id: str
    epss_score: float = Field(..., description="Probability of exploitation in the wild over next 30 days (0.0 to 1.0)")
    percentile: float = Field(..., description="Empirical ranking percentile relative to all scored CVEs (0.0 to 1.0)")
    interpretation: str = Field(..., description="Exploitation likelihood qualitative interpretation")
    model_version: Optional[str] = None
    score_date: Optional[str] = None


class VulnerabilityRecord(BaseModel):
    cve_id: str
    description: str
    severity: str = Field(default="UNKNOWN", description="CRITICAL, HIGH, MEDIUM, LOW, or UNKNOWN")
    cvss_v3_score: Optional[float] = None
    cvss_v3_vector: Optional[str] = None
    cvss_v2_score: Optional[float] = None
    affected_products: List[str] = Field(default_factory=list)
    published_date: Optional[str] = None
    modified_date: Optional[str] = None
    references: List[str] = Field(default_factory=list)
    # CISA KEV overlay
    in_cisa_kev: bool = False
    cisa_action: Optional[str] = None
    cisa_due_date: Optional[str] = None
    known_ransomware: bool = False
    # FIRST EPSS overlay
    epss: Optional[EpssRecord] = None


class VulnerabilityQueryResponse(BaseModel):
    total: int
    count: int
    limit: int
    offset: int
    query: Optional[str] = None
    severity: Optional[str] = None
    kev_only: bool = False
    vulnerabilities: List[VulnerabilityRecord]


class IntelligenceStatusResponse(BaseModel):
    status: str
    offline_ready: bool
    summary_counts: Dict[str, int]
    sources_status: Dict[str, Any]
    last_synced_utc: Optional[str] = None
    optional_services: Dict[str, Any]
    attribution: Dict[str, Any]
    disclaimer: str


class IncidentExplanationRequest(BaseModel):
    incident_id: Optional[str] = None
    threat_category: Optional[str] = "Exploitation"
    affected_asset: Optional[str] = "srv-web-01"
    target_crown_jewel: Optional[str] = "db-prod-01"
    technique_ids: List[str] = Field(default_factory=list)
    cve_ids: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = "ISOLATE_WORKSTATION"


class IncidentExplanationResponse(BaseModel):
    incident_id: Optional[str] = None
    generator: str = Field(..., description="'local_ollama' or 'deterministic_template_fallback'")
    model: str
    summary: str
    tactical_analysis: str
    vulnerability_context: str
    containment_rationale: str
    disclaimer: str
