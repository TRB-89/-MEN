"""Threat Intelligence Sources and Attribution Metadata.

Defines official repositories, licenses, copyright notices, and defensive usage
policies for MITRE ATT&CK, NVD, CISA KEV, FIRST EPSS, and local Ollama.
"""

from typing import Dict, Any

SOURCES_METADATA: Dict[str, Dict[str, Any]] = {
    "mitre_attack": {
        "name": "MITRE ATT&CK® Enterprise Matrix",
        "repository": "https://github.com/mitre-attack/attack-stix-data",
        "documentation": "https://attack.mitre.org/",
        "license": "Apache License 2.0 / CC-BY 4.0",
        "copyright": "© 2025 The MITRE Corporation.",
        "attribution_notice": (
            "This work contains content from MITRE ATT&CK®, reproduced and distributed "
            "with permission of The MITRE Corporation under the Apache 2.0 license. "
            "MITRE ATT&CK and ATT&CK are registered trademarks of The MITRE Corporation."
        ),
        "offline_cached": True,
    },
    "cisa_kev": {
        "name": "CISA Known Exploited Vulnerabilities (KEV) Catalog",
        "repository": "https://github.com/cisagov/kev-data",
        "documentation": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        "license": "CC0 1.0 Universal / Public Domain (U.S. Government Work 17 U.S.C. § 105)",
        "copyright": "Cybersecurity and Infrastructure Security Agency (CISA)",
        "attribution_notice": (
            "Source: Cybersecurity and Infrastructure Security Agency (CISA) Known Exploited "
            "Vulnerabilities Catalog. Public domain government data provided as a defensive cybersecurity utility."
        ),
        "offline_cached": True,
    },
    "nvd": {
        "name": "National Vulnerability Database (NVD)",
        "repository": "https://github.com/fkie-cad/nvd-json-data-feeds",
        "official_feed": "https://nvd.nist.gov/vuln/data-feeds",
        "documentation": "https://nvd.nist.gov/",
        "license": "Public Domain (U.S. Government Work) / NIST Open Data Policy",
        "copyright": "National Institute of Standards and Technology (NIST)",
        "attribution_notice": (
            "This product uses data feeds provided by the National Vulnerability Database (NVD) "
            "operated by NIST. NIST does not endorse or certify this product."
        ),
        "offline_cached": True,
    },
    "first_epss": {
        "name": "FIRST Exploit Prediction Scoring System (EPSS)",
        "repository": "https://github.com/empiricalsec/epss_scores",
        "documentation": "https://www.first.org/epss/",
        "license": "FIRST EPSS Data License / Creative Commons Zero (CC0)",
        "copyright": "Forum of Incident Response and Security Teams (FIRST.Org, Inc.)",
        "attribution_notice": (
            "EPSS data provided courtesy of FIRST.Org, Inc. EPSS estimates the probability of "
            "in-the-wild exploitation over the next 30 days. It does not represent probability of traversal."
        ),
        "offline_cached": True,
    },
    "ollama": {
        "name": "Ollama Local LLM Inference",
        "repository": "https://github.com/ollama/ollama",
        "documentation": "https://ollama.ai/",
        "license": "MIT License",
        "copyright": "Ollama Authors",
        "attribution_notice": (
            "Optional local AI inference engine running strictly on localhost (11434). "
            "Does not transmit sensitive incident records to cloud APIs."
        ),
        "offline_cached": True,
    },
}

SAFETY_DISCLAIMER: str = (
    "ØMEN is a defensive educational cybersecurity simulation platform. Threat intelligence datasets "
    "(MITRE ATT&CK, NVD, CISA KEV, EPSS) are integrated for correlation, situational awareness, and "
    "explainable risk modeling. ATT&CK techniques reflect empirical tactics, not traversal probabilities. "
    "EPSS scores estimate global wild exploitation likelihood. CVE associations require matching software "
    "evidence or explicitly declared scenario assumptions."
)
