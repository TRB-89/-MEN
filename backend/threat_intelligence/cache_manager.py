"""Local Threat Intelligence Cache Manager.

Safely handles local filesystem caching, reading, and atomic persistence
of normalized threat intelligence records in backend/data/threat_intel/.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("omen.threat_intelligence.cache")

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "threat_intel"
)


def get_data_dir() -> str:
    """Ensure data/threat_intel cache directory exists and return absolute path."""
    os.makedirs(DATA_DIR, exist_ok=True)
    return DATA_DIR


def read_json_cache(filename: str) -> Optional[Dict[str, Any]]:
    """Read and deserialize a cached JSON file."""
    path = os.path.join(get_data_dir(), filename)
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading cache file {filename}: {e}")
        return None


def write_json_cache(filename: str, data: Dict[str, Any]) -> bool:
    """Atomically write data to local JSON cache."""
    target_path = os.path.join(get_data_dir(), filename)
    tmp_path = target_path + ".tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        if os.path.exists(target_path):
            os.remove(target_path)
        os.rename(tmp_path, target_path)
        return True
    except Exception as e:
        logger.error(f"Error writing cache file {filename}: {e}")
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
        return False


def cache_exists(filename: str) -> bool:
    """Check if cache file exists and has non-zero size."""
    path = os.path.join(get_data_dir(), filename)
    return os.path.exists(path) and os.path.getsize(path) > 10
