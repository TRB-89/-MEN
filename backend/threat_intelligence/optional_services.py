"""Optional External Credential-Requiring Services Handler.

Checks environment variables for VirusTotal, AbuseIPDB, and Gemini API keys.
Does not require any paid/external API keys for normal ØMEN operation, and never
exposes backend secrets to the frontend.
"""

import os
import logging
from typing import Dict, Any

logger = logging.getLogger("omen.threat_intelligence.optional_services")


def get_optional_services_status() -> Dict[str, Any]:
    """Inspect status of optional credentialed external APIs."""
    vt_key = os.getenv("VIRUSTOTAL_API_KEY")
    abuse_key = os.getenv("ABUSEIPDB_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    return {
        "virustotal": {
            "name": "VirusTotal File/IP Reputation API",
            "available": bool(vt_key and len(vt_key) > 5),
            "status": "Configured (API key detected)" if vt_key else "Disabled (No API key required)",
            "requires_key": True,
        },
        "abuseipdb": {
            "name": "AbuseIPDB IP Blacklist Check",
            "available": bool(abuse_key and len(abuse_key) > 5),
            "status": "Configured (API key detected)" if abuse_key else "Disabled (No API key required)",
            "requires_key": True,
        },
        "gemini": {
            "name": "Google Gemini Cloud AI API",
            "available": bool(gemini_key and len(gemini_key) > 5),
            "status": "Configured (API key detected)" if gemini_key else "Disabled (Local Ollama/Template Fallback Active)",
            "requires_key": True,
        },
    }
