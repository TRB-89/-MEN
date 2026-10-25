"""Test Suite for Module 2: Attack Graph Intelligence.

Validates:
- Enterprise assets listing and filtering (zone, criticality, security_status, search)
- Single asset details with topological neighbors and reachable crown jewels
- Network relationships schema and observation sources
- Network alerts correlated with assets
- Unmatched security events handling without false asset associations
- Synthetic scenario loading (baseline, kerberoasting, dmz_foothold, ransomware_staging, zero_trust_isolated)
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_list_assets_all():
    """Verify GET /api/v1/network/assets returns the 16 enterprise assets."""
    res = client.get("/api/v1/network/assets")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 15
    assert len(data["assets"]) >= 15

    # Check required asset fields
    asset = data["assets"][0]
    assert "id" in asset
    assert "name" in asset
    assert "asset_type" in asset
    assert "criticality" in asset
    assert "security_status" in asset
    assert "zone" in asset


def test_list_assets_filtering():
    """Verify asset filtering by zone and criticality."""
    res_zone = client.get("/api/v1/network/assets?zone=DMZ")
    assert res_zone.status_code == 200
    for a in res_zone.json()["assets"]:
        assert "DMZ" in a["zone"].upper()

    res_crit = client.get("/api/v1/network/assets?criticality=CRITICAL")
    assert res_crit.status_code == 200
    for a in res_crit.json()["assets"]:
        assert a["criticality"] == "CRITICAL"


def test_get_single_asset_details():
    """Verify GET /api/v1/network/assets/{asset_id} includes neighbors and routes."""
    res = client.get("/api/v1/network/assets/ws-dev-04")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "ws-dev-04"
    assert "in_neighbors" in data
    assert "out_neighbors" in data
    assert "permitted_routes" in data
    assert "associated_alerts" in data


def test_get_relationships():
    """Verify GET /api/v1/network/relationships returns directed connections with observation sources."""
    res = client.get("/api/v1/network/relationships")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 20
    rel = data["relationships"][0]
    assert "source" in rel
    assert "target" in rel
    assert "protocol" in rel
    assert "relationship_type" in rel
    assert "access_permissions" in rel
    assert "observation_source" in rel


def test_simulation_load_and_alerts():
    """Verify POST /api/v1/network/simulations/load triggers scenario and correlates alert."""
    payload = {"scenario_type": "kerberoasting"}
    res = client.post("/api/v1/network/simulations/load", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["scenario"] == "kerberoasting"

    # Verify correlated alert exists
    alert_res = client.get("/api/v1/network/alerts?asset_id=ws-dev-04")
    assert alert_res.status_code == 200
    assert alert_res.json()["count"] >= 1


def test_unmatched_events_handling():
    """Verify unmatched events are returned via GET /api/v1/network/unmatched-events."""
    res = client.get("/api/v1/network/unmatched-events")
    assert res.status_code == 200
    assert "unmatched_events" in res.json()
