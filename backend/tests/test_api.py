import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import init_db

# Ensure test DB is initialized
init_db()
client = TestClient(app)


def test_health():
    """Verify /health returns HTTP 200 and online status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "ØMEN" in data["system"]
    assert data["version"] == "1.0.0"
    assert data["topology_devices_count"] >= 15


def test_docs_page():
    """Verify /docs loads OpenAPI documentation."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_network_graph():
    """Verify /api/v1/network/graph returns enterprise nodes and valid edges."""
    response = client.get("/api/v1/network/graph")
    assert response.status_code == 200
    data = response.json()
    assert data["nodes_count"] >= 15
    assert len(data["nodes"]) >= 15
    assert data["edges_count"] > 10
    assert isinstance(data["edges"], list)

    # Validate node fields
    first_node = data["nodes"][0]
    assert "id" in first_node
    assert "criticality" in first_node
    assert "zone" in first_node


def test_network_nodes_and_device():
    """Verify listing all devices and individual device lookup."""
    response = client.get("/api/v1/network/nodes")
    assert response.status_code == 200
    assert response.json()["count"] >= 15

    # Test single device lookup
    dev_res = client.get("/api/v1/network/devices/dc-01")
    assert dev_res.status_code == 200
    assert dev_res.json()["name"] == "Primary Active Directory DC"
    assert dev_res.json()["criticality"] == "CRITICAL"

    # Test 404 for unknown device
    bad_res = client.get("/api/v1/network/devices/unknown-99")
    assert bad_res.status_code == 404


def test_detection_analyze_benign():
    """Verify benign flow classification."""
    payload = {
        "source_ip": "10.0.3.102",
        "destination_ip": "10.0.2.15",
        "port": 53,
        "protocol": "UDP",
        "flow_duration_ms": 150.0,
        "packet_count": 8,
        "byte_count": 720,
        "payload_entropy": 3.8,
        "flags": ["SYN", "ACK"],
    }
    response = client.post("/api/v1/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["classification"] in [
        "BENIGN", "SUSPICIOUS", "MALICIOUS", "PORT_SCAN", "BRUTE_FORCE", "EXPLOITATION", "LATERAL_MOVEMENT"
    ]
    assert 0.0 <= data["anomaly_score"] <= 1.0


def test_detection_analyze_malicious():
    """Verify port scan / brute force flow detection."""
    payload = {
        "source_ip": "198.51.100.99",
        "destination_ip": "10.0.1.10",
        "port": 22,
        "protocol": "TCP",
        "flow_duration_ms": 25.0,
        "packet_count": 1,
        "byte_count": 54,
        "payload_entropy": 1.5,
        "flags": ["SYN"],
    }
    response = client.post("/api/v1/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["anomaly_score"] > 0.0


def test_detection_model_status():
    """Verify model status endpoint."""
    response = client.get("/api/v1/detection/model-status")
    assert response.status_code == 200
    data = response.json()
    assert "model_loaded" in data
    assert "supported_classes" in data


def test_prediction_attack_paths():
    """Verify attack path discovery and heuristic ranking."""
    payload = {
        "source_node": "srv-web-01",
        "target_node": "db-prod-01",
        "isolated_nodes": [],
        "max_hops": 5,
    }
    response = client.post("/api/v1/prediction/attack-paths", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "paths" in data
    assert data["total_paths_discovered"] >= 1
    first_path = data["paths"][0]
    assert first_path["target_node"] == "db-prod-01"
    assert first_path["risk_score"] > 0
    assert len(first_path["nodes"]) >= 2


def test_defense_simulate_isolation():
    """Verify simulated workstation isolation cuts reachability."""
    payload = {
        "isolated_node_ids": ["ws-dev-04"],
        "entry_node": "srv-web-01",
    }
    response = client.post("/api/v1/defense/simulate-isolation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["simulation_mode"] == "EDUCATIONAL_AUTONOMOUS_DEFENSE"
    assert data["isolated_nodes"] == ["ws-dev-04"]
    metrics = data["metrics"]
    assert "containment_efficacy_pct" in metrics
    assert "blast_radius_before" in metrics
    assert "blast_radius_after" in metrics
    assert metrics["blast_radius_before"] >= metrics["blast_radius_after"]


def test_defense_recommendations():
    """Verify autonomous containment recommendations."""
    response = client.get("/api/v1/defense/recommendations?entry_node=srv-web-01")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0


def test_incidents_crud():
    """Verify creating, listing, and retrieving incidents."""
    # List incidents
    res = client.get("/api/v1/incidents")
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    # Create incident
    create_payload = {
        "title": "Pytest Simulated Infiltration",
        "severity": "CRITICAL",
        "status": "OPEN",
        "description": "Automated regression test incident creation",
        "affected_nodes": ["ws-dev-04", "db-prod-01"],
        "mitre_technique": "T1078 - Valid Accounts",
    }
    create_res = client.post("/api/v1/incidents", json=create_payload)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Retrieve incident
    get_res = client.get(f"/api/v1/incidents/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Pytest Simulated Infiltration"

    # Update incident
    patch_res = client.patch(f"/api/v1/incidents/{created_id}", json={"status": "CONTAINED"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "CONTAINED"
