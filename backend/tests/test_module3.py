"""Comprehensive integration and unit test suite for Module 3: Attack Path Prediction Engine."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import init_db, SessionLocal, AttackPathPredictionRecord
from backend.path_prediction.graph_loader import load_prediction_graph
from backend.path_prediction.path_finder import find_candidate_paths
from backend.path_prediction.risk_engine import evaluate_path_risk
from backend.path_prediction.mitre_kb import resolve_mitre_technique


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()


def test_engine_health_endpoint(client):
    """Test Module 3 health endpoint returns online status and graph metrics."""
    response = client.get("/api/v1/attack-paths/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["topology_loaded"] is True
    assert data["total_nodes"] >= 16
    assert data["total_edges"] >= 20
    assert data["version"] == "OMEN-AP-2.1"


def test_critical_assets_endpoint(client):
    """Test critical-assets endpoint returns all crown jewel candidates."""
    response = client.get("/api/v1/attack-paths/critical-assets")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) > 0
    # Crown jewels like db-prod-01 and dc-01 should be present
    asset_ids = [a["id"] for a in assets]
    assert "db-prod-01" in asset_ids
    assert "dc-01" in asset_ids


def test_predict_attack_paths_valid_target(client):
    """Test valid prediction from DMZ web server to production database."""
    payload = {
        "source_asset_id": "srv-web-01",
        "target_asset_id": "db-prod-01",
        "max_depth": 5,
        "top_k": 5,
        "isolated_nodes": [],
        "simulation_mode": True,
    }
    response = client.post("/api/v1/attack-paths/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_asset_id"] == "srv-web-01"
    assert data["target_asset_id"] == "db-prod-01"
    assert data["total_candidate_paths"] > 0
    assert len(data["candidate_paths"]) > 0

    first_path = data["candidate_paths"][0]
    assert first_path["source_node"] == "srv-web-01"
    assert first_path["target_node"] == "db-prod-01"
    assert first_path["hops"] >= 1
    assert 0.0 <= first_path["risk_score"] <= 100.0
    assert first_path["risk_category"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW")

    # Check risk factor breakdown
    factors = first_path["risk_factors"]
    assert "vulnerability_severity" in factors
    assert "asset_criticality" in factors
    assert "detection_evidence_level" in factors

    # Check hop details and MITRE ATT&CK integration
    assert len(first_path["hop_details"]) == first_path["hops"]
    for hop in first_path["hop_details"]:
        assert hop["mitre_technique_id"].startswith("T")
        assert len(hop["mitre_technique_name"]) > 0
        assert len(hop["protocol"]) > 0
        assert isinstance(hop["port"], int)

    # Verify SQLite persistence
    pred_id = data["prediction_id"]
    get_res = client.get(f"/api/v1/attack-paths/{pred_id}")
    assert get_res.status_code == 200
    saved = get_res.json()
    assert saved["id"] == pred_id
    assert saved["source_asset_id"] == "srv-web-01"


def test_predict_attack_paths_from_developer_workstation(client):
    """Synthetic test scenario: Workstation (ws-dev-04) pivot to core DC/DB."""
    payload = {
        "source_asset_id": "ws-dev-04",
        "target_asset_id": "dc-01",
        "max_depth": 5,
        "top_k": 3,
    }
    response = client.post("/api/v1/attack-paths/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_candidate_paths"] > 0
    for p in data["candidate_paths"]:
        assert p["nodes"][0] == "ws-dev-04"
        assert p["nodes"][-1] == "dc-01"


def test_predict_attack_paths_unreachable_target(client):
    """Test prediction to unreachable or isolated destination returns 0 paths gracefully."""
    payload = {
        "source_asset_id": "ws-hr-02",
        "target_asset_id": "gw-ext-01",  # Internal workstation cannot traverse backwards to external edge
        "max_depth": 3,
        "top_k": 5,
    }
    response = client.post("/api/v1/attack-paths/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_candidate_paths"] == 0
    assert len(data["candidate_paths"]) == 0


def test_predict_attack_paths_invalid_source(client):
    """Test prediction with nonexistent source node returns descriptive empty response."""
    payload = {
        "source_asset_id": "nonexistent-asset-99",
        "target_asset_id": "db-prod-01",
    }
    response = client.post("/api/v1/attack-paths/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_candidate_paths"] == 0
    assert "not in active graph" in str(data["data_provenance"])


def test_node_isolation_blocks_attack_path(client):
    """Test that isolating an intermediate bridge node severs the attack path."""
    # Without isolation, ws-dev-04 can reach db-prod-01
    baseline_payload = {
        "source_asset_id": "ws-dev-04",
        "target_asset_id": "db-prod-01",
        "max_depth": 4,
        "isolated_nodes": [],
    }
    base_res = client.post("/api/v1/attack-paths/predict", json=baseline_payload).json()
    assert base_res["total_candidate_paths"] > 0

    # With key bridges isolated, attack corridors are eliminated or reduced
    isolated_payload = {
        "source_asset_id": "ws-dev-04",
        "target_asset_id": "db-prod-01",
        "max_depth": 4,
        "isolated_nodes": ["sw-core-01", "ws-admin-01", "dc-01"],
    }
    iso_res = client.post("/api/v1/attack-paths/predict", json=isolated_payload).json()
    assert iso_res["total_candidate_paths"] < base_res["total_candidate_paths"]


def test_prediction_history_endpoint(client):
    """Test retrieving history from SQLite database."""
    response = client.get("/api/v1/attack-paths/history?limit=10")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    if len(history) > 0:
        first = history[0]
        assert "prediction_id" in first
        assert "highest_risk_score" in first
        assert "source_asset_id" in first


def test_legacy_prediction_api_compatibility(client):
    """Test that existing /api/v1/prediction/attack-paths endpoint continues functioning."""
    legacy_payload = {
        "source_node": "srv-web-01",
        "target_node": "db-prod-01",
        "max_hops": 5,
        "isolated_nodes": [],
    }
    response = client.post("/api/v1/prediction/attack-paths", json=legacy_payload)
    assert response.status_code == 200
    data = response.json()
    assert "source_node" in data
    assert "paths" in data
    assert "critical_chokepoints" in data
    assert len(data["paths"]) > 0


def test_mitre_technique_resolution():
    """Unit test MITRE ATT&CK resolution logic."""
    res1 = resolve_mitre_technique("gw-ext-01", "fw-dmz-01")
    assert res1["id"] == "T1190"

    res2 = resolve_mitre_technique("ws-admin-01", "dc-01")
    assert res2["id"] == "T1003.003"
    assert res2["tactic"] == "Credential Access"

    res_ssh = resolve_mitre_technique("any-a", "any-b", protocol="SSH", port=22)
    assert res_ssh["id"] == "T1021.004"
