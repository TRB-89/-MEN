"""Comprehensive integration and unit test suite for Module 4: Autonomous Defense Simulation Engine."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import init_db, SessionLocal, DefenseSimulationRecord, DefenseApprovalRecord
from backend.defense.schemas import DefenseActionType
from backend.defense.simulation_engine import run_defense_simulation
from backend.defense.action_catalog import generate_candidate_actions
from backend.defense.impact_analysis import analyze_business_impact
from backend.path_prediction.graph_loader import load_prediction_graph


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client


def test_defense_engine_health(client):
    """Test Module 4 health endpoint returns online status and supported action list."""
    res = client.get("/api/v1/defense/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE"
    assert data["version"] == "OMEN-DEF-2.1"
    assert len(data["supported_actions"]) == 4
    assert "WORKSTATION_ISOLATION" in data["supported_actions"]
    assert "CONNECTION_RESTRICTION" in data["supported_actions"]
    assert "SESSION_REVOCATION" in data["supported_actions"]
    assert "ENHANCED_MONITORING" in data["supported_actions"]


def test_list_supported_actions(client):
    """Test actions catalog endpoint."""
    res = client.get("/api/v1/defense/actions")
    assert res.status_code == 200
    actions = res.json()
    assert len(actions) == 4
    types = [a["action_type"] for a in actions]
    assert "WORKSTATION_ISOLATION" in types
    assert "ENHANCED_MONITORING" in types


def test_simulate_workstation_isolation(client):
    """Test simulating isolation of lead developer workstation (ws-dev-04)."""
    payload = {
        "action_type": "WORKSTATION_ISOLATION",
        "target_entity": "ws-dev-04",
        "entry_node": "srv-web-01",
        "target_asset_id": "db-prod-01",
    }
    res = client.post("/api/v1/defense/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "WORKSTATION_ISOLATION"
    assert data["target_entity"] == "ws-dev-04"
    assert data["metrics"]["severed_edges_count"] > 0
    assert data["metrics"]["risk_reduction_pct"] >= 0.0
    assert "business_impact" in data
    assert len(data["business_impact"]["disrupted_legitimate_services"]) > 0

    # Verify SQLite persistence
    sim_id = data["simulation_id"]
    get_res = client.get(f"/api/v1/defense/simulations/{sim_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == sim_id


def test_simulate_connection_restriction(client):
    """Test simulating restriction of specific network edge srv-web-01 -> sw-core-01."""
    payload = {
        "action_type": "CONNECTION_RESTRICTION",
        "target_entity": "srv-web-01->sw-core-01",
        "entry_node": "srv-web-01",
        "target_asset_id": "db-prod-01",
    }
    res = client.post("/api/v1/defense/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "CONNECTION_RESTRICTION"
    assert data["metrics"]["severed_edges_count"] == 1
    assert data["metrics"]["risk_reduction_pct"] >= 0.0


def test_simulate_session_revocation(client):
    """Test simulating revocation of privileged authentication edge ws-admin-01 -> dc-01."""
    payload = {
        "action_type": "SESSION_REVOCATION",
        "target_entity": "ws-admin-01->dc-01",
        "entry_node": "ws-dev-04",
        "target_asset_id": "db-prod-01",
    }
    res = client.post("/api/v1/defense/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "SESSION_REVOCATION"
    assert data["metrics"]["severed_edges_count"] == 1
    assert data["business_impact"]["operational_friction"] in ("MINIMAL", "NONE", "MODERATE")


def test_simulate_enhanced_monitoring(client):
    """Test that enhanced monitoring improves visibility without severing reachable communication."""
    payload = {
        "action_type": "ENHANCED_MONITORING",
        "target_entity": "sw-core-01",
        "entry_node": "srv-web-01",
        "target_asset_id": "db-prod-01",
    }
    res = client.post("/api/v1/defense/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["action_type"] == "ENHANCED_MONITORING"
    # Zero communication edges severed
    assert data["metrics"]["severed_edges_count"] == 0
    # Blast radius unchanged (reachability intact)
    assert data["metrics"]["blast_radius_after"] == data["metrics"]["blast_radius_before"]
    # Zero legitimate business downtime
    assert data["business_impact"]["estimated_downtime_minutes"] == 0.0


def test_baseline_graph_immutability():
    """Verify that running simulations does NOT mutate the underlying baseline graph."""
    G_baseline, _ = load_prediction_graph()
    nodes_before = set(G_baseline.nodes)
    edges_before = set(G_baseline.edges)

    # Execute simulation
    run_defense_simulation(
        action_type=DefenseActionType.WORKSTATION_ISOLATION,
        target_entity="ws-dev-04",
        entry_node="srv-web-01",
    )

    # Check baseline again
    G_after, _ = load_prediction_graph()
    assert set(G_after.nodes) == nodes_before
    assert set(G_after.edges) == edges_before


def test_defense_recommendations_endpoint(client):
    """Test multi-objective defense recommendation ranking."""
    payload = {
        "entry_node": "srv-web-01",
        "target_asset_id": "db-prod-01",
        "max_recommendations": 4,
        "risk_weight": 0.7,
        "disruption_weight": 0.3,
    }
    res = client.post("/api/v1/defense/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "recommended_strategy" in data
    assert data["recommended_strategy"]["rank"] == 1
    assert data["recommended_strategy"]["projected_risk_reduction_pct"] >= 0.0
    assert len(data["alternative_strategies"]) <= 3
    assert "scoring_weights" in data


def test_defense_approval_workflow(client):
    """Test SecOps analyst approval of a simulation plan."""
    # First create a simulation
    sim_res = client.post("/api/v1/defense/simulate", json={
        "action_type": "WORKSTATION_ISOLATION",
        "target_entity": "ws-dev-04",
        "entry_node": "srv-web-01",
    }).json()

    sim_id = sim_res["simulation_id"]

    # Submit approval
    app_res = client.post("/api/v1/defense/approve", json={
        "simulation_id": sim_id,
        "analyst_id": "lead_soc_analyst",
        "decision": "APPROVED",
        "notes": "Verified threat containment; engineering team notified of temporary workstation isolation.",
    })
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["decision"] == "APPROVED"
    assert app_data["analyst_id"] == "lead_soc_analyst"

    # Verify status updated in database
    detail = client.get(f"/api/v1/defense/simulations/{sim_id}").json()
    assert detail["approval_status"] == "APPROVED"


def test_legacy_simulate_isolation_compatibility(client):
    """Test that legacy /api/v1/defense/simulate-isolation continues working."""
    payload = {
        "isolated_node_ids": ["ws-dev-04"],
        "entry_node": "srv-web-01",
    }
    res = client.post("/api/v1/defense/simulate-isolation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "containment_efficacy_pct" in data["metrics"]
    assert "reachability_comparison" in data
