"""Threat Intelligence Integration Package for ØMEN.

Unifies MITRE ATT&CK STIX, NVD CVE feeds, CISA KEV catalog, and FIRST EPSS scores
into an offline-first defensive cybersecurity intelligence platform.
"""

from backend.threat_intelligence.intelligence_service import intelligence_service
from backend.threat_intelligence.sources import SOURCES_METADATA, SAFETY_DISCLAIMER
from backend.threat_intelligence.ollama_assistant import generate_incident_explanation, is_ollama_available

__all__ = [
    "intelligence_service",
    "SOURCES_METADATA",
    "SAFETY_DISCLAIMER",
    "generate_incident_explanation",
    "is_ollama_available",
]
