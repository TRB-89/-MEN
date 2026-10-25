"""FIRST Exploit Prediction Scoring System (EPSS) Data Loader.

Loads, validates, and indexes EPSS scores and empirical percentiles.
EPSS estimates the probability that a software vulnerability will be exploited
in the wild over the next 30 days.
"""

import logging
import urllib.request
import gzip
import io
import csv
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from backend.threat_intelligence.cache_manager import read_json_cache, write_json_cache, cache_exists
from backend.threat_intelligence.schemas import EpssRecord

logger = logging.getLogger("omen.threat_intelligence.epss")

EPSS_CACHE_FILE = "epss_scores.json"
EPSS_REMOTE_URL = "https://raw.githubusercontent.com/empiricalsec/epss_scores/main/2026/epss_scores-2026-10-25.csv.gz"


def load_epss_scores(force_refresh: bool = False, timeout: int = 45) -> Dict[str, EpssRecord]:
    """Load EPSS scores from cache, fetching if absent or forced."""
    if not force_refresh and cache_exists(EPSS_CACHE_FILE):
        cached = read_json_cache(EPSS_CACHE_FILE)
        if cached and "scores" in cached:
            return _deserialize_epss_dict(cached["scores"], cached.get("model_version"), cached.get("score_date"))

    # Download from official repository
    try:
        logger.info(f"Downloading FIRST EPSS scores snapshot from {EPSS_REMOTE_URL}...")
        req = urllib.request.Request(
            EPSS_REMOTE_URL,
            headers={"User-Agent": "OMEN-ThreatIntel/2.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            compressed = resp.read()

        model_version = "v2026.06.15"
        score_date = datetime.now(timezone.utc).isoformat()
        scores_dict = {}

        with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as gz:
            text_io = io.TextIOWrapper(gz, encoding="utf-8")
            line1 = text_io.readline()
            if line1.startswith("#model_version:"):
                parts = line1.strip("#\r\n ").split(",")
                for p in parts:
                    if "model_version:" in p:
                        model_version = p.split("model_version:")[1].strip()
                    elif "score_date:" in p:
                        score_date = p.split("score_date:")[1].strip()

            reader = csv.reader(text_io)
            header = next(reader, None)  # cve,epss,percentile
            for row in reader:
                if len(row) >= 3:
                    cve = row[0].strip().upper()
                    try:
                        score = float(row[1])
                        pct = float(row[2])
                        scores_dict[cve] = {
                            "epss": score,
                            "percentile": pct,
                        }
                    except ValueError:
                        continue

        cache_payload = {
            "model_version": model_version,
            "score_date": score_date,
            "count": len(scores_dict),
            "last_synced_utc": datetime.now(timezone.utc).isoformat(),
            "source": "https://github.com/empiricalsec/epss_scores",
            "scores": scores_dict,
        }
        write_json_cache(EPSS_CACHE_FILE, cache_payload)
        logger.info(f"EPSS cached successfully: {len(scores_dict)} scores indexed.")
        return _deserialize_epss_dict(scores_dict, model_version, score_date)

    except Exception as e:
        logger.error(f"Failed to fetch EPSS snapshot from repository: {e}")
        fallback = read_json_cache(EPSS_CACHE_FILE)
        if fallback and "scores" in fallback:
            return _deserialize_epss_dict(fallback["scores"], fallback.get("model_version"), fallback.get("score_date"))
        return _fallback_seed_epss()


def interpret_epss(epss_score: float, percentile: float) -> str:
    """Provide explainable qualitative interpretation of EPSS metric."""
    pct_str = f"{percentile * 100.0:.1f}%"
    prob_str = f"{epss_score * 100.0:.1f}%"
    if epss_score >= 0.70:
        return f"CRITICAL: Very high 30-day wild exploitation probability ({prob_str}, top {pct_str} of all CVEs). Widespread automated weaponization."
    elif epss_score >= 0.35:
        return f"HIGH: Elevated wild exploitation likelihood ({prob_str}, top {pct_str} of all CVEs). Urgent defensive patching advised."
    elif epss_score >= 0.10:
        return f"MODERATE: Measurable exploitation probability ({prob_str}, top {pct_str}). Monitored by security telemetry."
    else:
        return f"LOW: Low observed probability of automated exploitation ({prob_str}, percentile: {pct_str})."


def _deserialize_epss_dict(
    scores_dict: Dict[str, Dict[str, Any]],
    model_version: Optional[str] = None,
    score_date: Optional[str] = None,
) -> Dict[str, EpssRecord]:
    """Convert raw dict into Pydantic records indexed by CVE ID."""
    records = {}
    m_ver = model_version or "v2026.06.15"
    s_date = score_date or datetime.now(timezone.utc).isoformat()
    for cve, data in scores_dict.items():
        epss_val = float(data.get("epss", 0.0))
        pct_val = float(data.get("percentile", 0.0))
        records[cve.upper()] = EpssRecord(
            cve_id=cve.upper(),
            epss_score=epss_val,
            percentile=pct_val,
            interpretation=interpret_epss(epss_val, pct_val),
            model_version=m_ver,
            score_date=s_date,
        )
    return records


def _fallback_seed_epss() -> Dict[str, EpssRecord]:
    """Minimal seed EPSS records for known synthetic network assets."""
    seeds = {
        "CVE-2023-3519": {"epss": 0.9745, "percentile": 0.9992},
        "CVE-2024-21413": {"epss": 0.8841, "percentile": 0.9925},
        "CVE-2021-44228": {"epss": 0.9753, "percentile": 0.9996},
        "CVE-2023-4966": {"epss": 0.9521, "percentile": 0.9978},
    }
    return _deserialize_epss_dict(seeds)
