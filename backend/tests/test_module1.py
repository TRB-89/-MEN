"""Test Suite for Module 1: Neural Threat Detection Engine.

Validates data preprocessing, feature consistency, PyTorch MLP inference,
Random Forest voting, Isolation Forest anomaly scoring, FastAPI endpoint schemas,
database persistence, and untrained model resilience.
"""

import os
import json
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.db import init_db, SessionLocal, DetectionRecord
from backend.detection.preprocessor import DataPreprocessor, LEAKAGE_COLUMNS
from backend.detection.threat_engine import threat_engine, NetworkFlowEvent
from backend.detection.mlp_network import ThreatDetectionMLP

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


# --- Test 1: Data Preprocessing & Leakage Shields ---

def test_preprocessor_leakage_shield():
    """Verify preprocessor strictly shields against leakage columns (id, label, attack_cat)."""
    df_dummy = pd.DataFrame({
        "id": [1, 2, 3],
        "label": [0, 1, 0],
        "attack_cat": ["Normal", "Exploits", "Normal"],
        "proto": ["tcp", "udp", "tcp"],
        "service": ["http", "-", "dns"],
        "state": ["FIN", "INT", "CON"],
        "dur": [0.1, 0.5, 0.2],
        "sbytes": [100, 500, 250],
        "dbytes": [200, 1000, 400],
    })

    prep = DataPreprocessor()
    X = prep.fit_transform(df_dummy)

    # Confirm leakage columns are not in numeric or categorical lists
    for col in LEAKAGE_COLUMNS:
        assert col not in prep.numeric_columns
        assert col not in prep.categorical_columns

    # Verify transformed dimensions
    assert X.shape[0] == 3
    assert X.shape[1] > 3


def test_feature_consistency_and_missing_features():
    """Verify preprocessor handles missing features during inference with graceful imputation."""
    df_train = pd.DataFrame({
        "proto": ["tcp", "udp"],
        "service": ["http", "dns"],
        "state": ["FIN", "CON"],
        "dur": [0.1, 0.2],
        "sbytes": [100, 200],
        "dbytes": [300, 400],
    })
    prep = DataPreprocessor()
    prep.fit(df_train)

    # Incomplete inference flow (missing dur and dbytes)
    partial_event = {"proto": "tcp", "service": "http", "state": "FIN", "sbytes": 150}
    transformed = prep.transform(partial_event)

    assert transformed.shape[0] == 1
    assert transformed.shape[1] == len(prep.feature_names_out)
    assert not np.isnan(transformed).any()


# --- Test 2: Model Loading and Inference ---

def test_models_loaded_status():
    """Verify model loading states via threat_engine."""
    threat_engine.reload_all_models()
    # At least Random Forest, PyTorch MLP, and Isolation Forest should be checked
    assert "random_forest" in threat_engine.models_loaded
    assert "mlp_neural_network" in threat_engine.models_loaded
    assert "isolation_forest" in threat_engine.models_loaded


def test_unified_threat_engine_inference():
    """Verify unified threat engine runs inference and returns structured alert."""
    event = NetworkFlowEvent(
        event_id="TEST-FLOW-01",
        device_id="ws-dev-04",
        proto="tcp",
        service="http",
        state="FIN",
        dur=0.05,
        sbytes=500,
        dbytes=1200,
        sttl=64,
        dttl=64,
        rate=50.0,
    )

    alert = threat_engine.analyze_event(event)

    assert alert.event_id == "TEST-FLOW-01"
    assert alert.device_id == "ws-dev-04"
    assert alert.threat_status in ["MALICIOUS", "SUSPICIOUS", "BENIGN", "UNKNOWN"]
    assert alert.severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert "rf_probability" in alert.model_scores
    assert "mlp_probability" in alert.model_scores
    assert "anomaly_index" in alert.model_scores
    assert alert.decision_rule is not None


# --- Test 3: API Endpoints (Step 6) ---

def test_api_detection_health():
    """Verify GET /api/v1/detection/health returns status and model states."""
    res = client.get("/api/v1/detection/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "models_loaded" in data
    assert "dataset_available" in data


def test_api_detection_models():
    """Verify GET /api/v1/detection/models returns metadata for all 3 models."""
    res = client.get("/api/v1/detection/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    models = data["models"]
    assert "random_forest" in models
    assert "mlp_neural_network" in models
    assert "isolation_forest" in models
    assert "preprocessor" in data


def test_api_detection_metrics():
    """Verify GET /api/v1/detection/metrics returns real measured benchmarks."""
    res = client.get("/api/v1/detection/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "evaluation_dataset" in data


def test_api_detection_analyze_endpoint():
    """Verify POST /api/v1/detection/analyze performs real multi-model inference and persists to DB."""
    payload = {
        "event_id": "TEST-API-001",
        "device_id": "ws-admin-01",
        "proto": "tcp",
        "service": "ssh",
        "state": "INT",
        "dur": 0.001,
        "sbytes": 80,
        "dbytes": 0,
        "sttl": 254,
        "dttl": 0,
        "rate": 10000.0,
    }

    res = client.post("/api/v1/detection/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["event_id"] == "TEST-API-001"
    assert data["threat_status"] in ["MALICIOUS", "SUSPICIOUS", "BENIGN"]
    assert "rf_probability" in data["model_scores"]
    assert "mlp_probability" in data["model_scores"]

    # Verify DB persistence
    db = SessionLocal()
    try:
        record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == "TEST-API-001").first()
        assert record is not None
        assert record.device_id == "ws-admin-01"
        assert record.threat_status == data["threat_status"]
    finally:
        db.close()


def test_api_detection_history():
    """Verify GET /api/v1/detection/history returns saved detections with filtering."""
    res = client.get("/api/v1/detection/history?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "records" in data
    assert isinstance(data["records"], list)
