"""ØMEN Threat Intelligence Package.

Integrates MITRE ATT&CK STIX data and CISA Known Exploited Vulnerabilities (KEV).
Provides offline caching, fast structured search, and explainable risk enrichment.
"""

from backend.threat_intel.service import threat_intel_service

__all__ = ["threat_intel_service"]
