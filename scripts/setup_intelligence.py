"""ØMEN Threat Intelligence Setup and Synchronization CLI Script.

Downloads, validates, normalizes, and caches public cybersecurity datasets:
1. MITRE ATT&CK® Enterprise STIX Matrix (mitre-attack/attack-stix-data)
2. CISA Known Exploited Vulnerabilities Catalog (cisagov/kev-data)
3. FIRST Exploit Prediction Scoring System (empiricalsec/epss_scores)
4. National Vulnerability Database CVE Records (fkie-cad/nvd-json-data-feeds)

Permits safe, repeated execution and generates local offline fixtures.
Usage:
    python scripts/setup_intelligence.py [--refresh] [--sample-only] [--verify]
"""

import os
import sys
import argparse
import logging
from datetime import datetime, timezone

# Add repository root to python path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from backend.threat_intelligence.sources import SOURCES_METADATA, SAFETY_DISCLAIMER
from backend.threat_intelligence.mitre_loader import load_mitre_techniques
from backend.threat_intelligence.kev_loader import load_cisa_kev
from backend.threat_intelligence.epss_loader import load_epss_scores
from backend.threat_intelligence.nvd_loader import load_nvd_vulnerabilities
from backend.threat_intelligence.intelligence_service import intelligence_service
from backend.threat_intelligence.cache_manager import get_data_dir

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("omen.setup_intelligence")


def run_setup(force_refresh: bool = False, sample_only: bool = False, verify_only: bool = False):
    print("=" * 72)
    print("  OMEN: BLACKSITE - THREAT INTELLIGENCE REPOSITORY SETUP")
    print("=" * 72)
    print(f"Destination Cache Directory: {get_data_dir()}")
    print(f"Execution Mode: {'Verify' if verify_only else 'Sample Offline' if sample_only else 'Live Sync / Refresh' if force_refresh else 'Standard Load'}")
    print("-" * 72)

    if verify_only:
        print("[*] Verifying existing threat intelligence caches...")
        status = intelligence_service.get_status()
        _print_summary(status)
        return

    # 1. MITRE ATT&CK
    print("[1/4] Synchronizing MITRE ATT&CK Enterprise STIX...")
    try:
        mitre_records = load_mitre_techniques(force_refresh=force_refresh and not sample_only)
        print(f"      [+] Extracted {len(mitre_records)} active enterprise techniques.")
    except Exception as e:
        print(f"      [-] MITRE loading warning: {e}")

    # 2. CISA KEV
    print("[2/4] Synchronizing CISA Known Exploited Vulnerabilities (KEV)...")
    try:
        kev_records = load_cisa_kev(force_refresh=force_refresh and not sample_only)
        print(f"      [+] Extracted {len(kev_records)} cataloged exploited vulnerabilities.")
    except Exception as e:
        print(f"      [-] CISA KEV loading warning: {e}")

    # 3. FIRST EPSS
    print("[3/4] Synchronizing FIRST Exploit Prediction Scoring System (EPSS)...")
    try:
        epss_records = load_epss_scores(force_refresh=force_refresh and not sample_only)
        print(f"      [+] Indexed {len(epss_records)} EPSS probability scores.")
    except Exception as e:
        print(f"      [-] EPSS loading warning: {e}")

    # 4. NVD Vulnerabilities
    print("[4/4] Synchronizing National Vulnerability Database (NVD) Feeds...")
    try:
        nvd_records = load_nvd_vulnerabilities(force_refresh=force_refresh and not sample_only)
        print(f"      [+] Cached {len(nvd_records)} base NVD vulnerability records with CVSS metrics.")
    except Exception as e:
        print(f"      [-] NVD loading warning: {e}")

    # 5. Initialize In-Memory Unified Intelligence Service
    print("[*] Normalizing unified cross-source intelligence index...")
    intelligence_service.initialize(force_refresh=False)
    status = intelligence_service.get_status()

    _print_summary(status)


def _print_summary(status):
    print("=" * 72)
    print("  INTELLIGENCE SYNCHRONIZATION SUMMARY")
    print("=" * 72)
    counts = status.summary_counts
    print(f"  • MITRE ATT&CK Techniques:         {counts.get('mitre_techniques', 0):,}")
    print(f"  • CISA KEV Exploited CVEs:         {counts.get('cisa_kev_vulnerabilities', 0):,}")
    print(f"  • Active Ransomware CVEs:          {counts.get('known_ransomware_associated', 0):,}")
    print(f"  • FIRST EPSS Probability Scores:   {counts.get('epss_scores', 0):,}")
    print(f"  • Unified Normalized CVE Records:  {counts.get('nvd_vulnerabilities', 0):,}")
    print(f"  • Offline Readiness Status:        {'ONLINE & READY' if status.offline_ready else 'DEGRADED'}")
    print("-" * 72)
    print("  ATTRIBUTION & LEGAL NOTICES:")
    print("  - MITRE ATT&CK: Apache License 2.0 / CC-BY 4.0 (© 2025 The MITRE Corp)")
    print("  - CISA KEV: CC0 1.0 Universal / Public Domain (U.S. Govt Work)")
    print("  - FIRST EPSS: FIRST.Org, Inc. 30-Day Global Wild Exploitation Estimates")
    print("  - NVD (NIST): Public Domain / NIST Open Data")
    print("-" * 72)
    print("  NOTICE ON DATA STALENESS:")
    print("  Vulnerability intelligence is inherently temporal. While ØMEN functions 100%")
    print("  offline using local caches, run 'python scripts/setup_intelligence.py --refresh'")
    print("  periodically to pull the latest CVE additions and EPSS model weights.")
    print("=" * 72)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ØMEN Threat Intelligence Dataset Setup")
    parser.add_argument("--refresh", action="store_true", help="Force re-download from upstream GitHub sources")
    parser.add_argument("--sample-only", action="store_true", help="Populate offline fixtures without network requests")
    parser.add_argument("--verify", action="store_true", help="Verify existing local intelligence caches")
    args = parser.parse_args()

    run_setup(force_refresh=args.refresh, sample_only=args.sample_only, verify_only=args.verify)
