import os
import json
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./omen_incidents.db")

# For SQLite, check_same_thread=False is needed for multi-threaded access in FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), nullable=False, default="OPEN")      # OPEN, INVESTIGATING, CONTAINED, RESOLVED
    description = Column(Text, nullable=True)
    affected_nodes = Column(Text, nullable=True)                     # JSON string list of node IDs
    mitre_technique = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        nodes = []
        if self.affected_nodes:
            try:
                nodes = json.loads(self.affected_nodes)
            except Exception:
                nodes = [n.strip() for n in self.affected_nodes.split(",") if n.strip()]
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity,
            "status": self.status,
            "description": self.description,
            "affected_nodes": nodes,
            "mitre_technique": self.mitre_technique,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    event_type = Column(String(100), nullable=False)
    source_ip = Column(String(45), nullable=False)
    destination_ip = Column(String(45), nullable=False)
    port = Column(Integer, nullable=True)
    protocol = Column(String(20), nullable=True, default="TCP")
    anomaly_score = Column(Float, nullable=False, default=0.0)
    classification = Column(String(50), nullable=False, default="BENIGN")
    raw_data = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "event_type": self.event_type,
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "port": self.port,
            "protocol": self.protocol,
            "anomaly_score": self.anomaly_score,
            "classification": self.classification,
            "raw_data": self.raw_data,
        }


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    simulation_type = Column(String(100), nullable=False, default="WORKSTATION_ISOLATION")
    isolated_nodes = Column(Text, nullable=False)                   # JSON string
    blast_radius_before = Column(Integer, nullable=False)
    blast_radius_after = Column(Integer, nullable=False)
    containment_score = Column(Float, nullable=False)                # Percentage reduction
    summary = Column(Text, nullable=True)

    def to_dict(self):
        nodes = []
        if self.isolated_nodes:
            try:
                nodes = json.loads(self.isolated_nodes)
            except Exception:
                nodes = [self.isolated_nodes]
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "simulation_type": self.simulation_type,
            "isolated_nodes": nodes,
            "blast_radius_before": self.blast_radius_before,
            "blast_radius_after": self.blast_radius_after,
            "containment_score": self.containment_score,
            "summary": self.summary,
        }


class DetectionRecord(Base):
    __tablename__ = "detection_records"

    detection_id = Column(String(50), primary_key=True, index=True)
    event_timestamp = Column(String(50), nullable=False)
    device_id = Column(String(50), nullable=True, index=True)
    threat_status = Column(String(30), nullable=False)   # MALICIOUS, SUSPICIOUS, BENIGN
    detected_attack_cat = Column(String(50), nullable=True)
    rf_score = Column(Float, nullable=True)
    mlp_score = Column(Float, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    alert_severity = Column(String(30), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    decision_rule = Column(String(100), nullable=False)
    supporting_evidence = Column(Text, nullable=True)    # JSON string
    model_version = Column(String(100), nullable=True)
    processing_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        evidence = {}
        if self.supporting_evidence:
            try:
                evidence = json.loads(self.supporting_evidence)
            except Exception:
                evidence = {"raw": self.supporting_evidence}
        return {
            "detection_id": self.detection_id,
            "event_timestamp": self.event_timestamp,
            "device_id": self.device_id,
            "threat_status": self.threat_status,
            "detected_attack_cat": self.detected_attack_cat,
            "rf_score": self.rf_score,
            "mlp_score": self.mlp_score,
            "anomaly_score": self.anomaly_score,
            "alert_severity": self.alert_severity,
            "decision_rule": self.decision_rule,
            "supporting_evidence": evidence,
            "model_version": self.model_version,
            "processing_timestamp": self.processing_timestamp.isoformat() if self.processing_timestamp else None,
        }



class NetworkAssetRecord(Base):
    __tablename__ = "network_assets"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    asset_type = Column(String(50), nullable=False)  # workstation, server, database, domain_controller, gateway, firewall, switch, identity, storage
    zone = Column(String(50), nullable=False)        # Perimeter, DMZ, Core, Corporate, Restricted
    subnet = Column(String(50), nullable=True)
    ip = Column(String(50), nullable=True, index=True)
    criticality = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    security_status = Column(String(20), nullable=False, default="SECURE")  # SECURE, SUSPICIOUS, COMPROMISED, ISOLATED
    vulnerabilities = Column(Text, nullable=True)     # JSON array string
    vuln_score = Column(Float, nullable=False, default=0.0)
    isolated = Column(Integer, nullable=False, default=0)
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(Text, nullable=True)      # JSON string for extra attributes

    def to_dict(self):
        vulns = []
        if self.vulnerabilities:
            try:
                vulns = json.loads(self.vulnerabilities)
            except Exception:
                vulns = [self.vulnerabilities]
        meta = {}
        if self.metadata_json:
            try:
                meta = json.loads(self.metadata_json)
            except Exception:
                meta = {}
        return {
            "id": self.id,
            "name": self.name,
            "asset_type": self.asset_type,
            "device_type": self.asset_type,
            "zone": self.zone,
            "subnet": self.subnet,
            "ip": self.ip,
            "criticality": self.criticality,
            "security_status": self.security_status,
            "compromised": self.security_status in ("COMPROMISED", "SUSPICIOUS"),
            "vulnerabilities": vulns,
            "vuln_score": self.vuln_score,
            "isolated": bool(self.isolated),
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "metadata": meta,
        }


class NetworkRelationshipRecord(Base):
    __tablename__ = "network_relationships"

    id = Column(String(100), primary_key=True)
    source_id = Column(String(50), nullable=False, index=True)
    target_id = Column(String(50), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, default="NETWORK_FLOW")  # NETWORK_FLOW, AUTHENTICATES_TO, MANAGES, REPLICATES_TO, ALLOWS_TRAFFIC
    direction = Column(String(20), nullable=False, default="DIRECTED")
    protocol = Column(String(50), nullable=True, default="TCP")
    port = Column(Integer, nullable=True, default=0)
    weight = Column(Float, nullable=False, default=1.0)
    access_permissions = Column(String(100), nullable=True)
    observation_source = Column(String(100), nullable=False, default="NETFLOW_TELEMETRY")  # FIREWALL_CONFIG, NETFLOW_TELEMETRY, ACTIVE_DIRECTORY_AUDIT, RUNTIME_SENSOR

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source_id,
            "target": self.target_id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "relationship_type": self.relationship_type,
            "direction": self.direction,
            "protocol": self.protocol,
            "port": self.port,
            "weight": self.weight,
            "access_permissions": self.access_permissions or f"ALLOW {self.protocol}/{self.port}",
            "observation_source": self.observation_source,
        }


class NetworkAlertRecord(Base):
    __tablename__ = "network_alerts"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), nullable=True, index=True)  # NULL when unmatched
    detection_id = Column(String(50), nullable=False, index=True)
    threat_status = Column(String(30), nullable=False)       # MALICIOUS, SUSPICIOUS, BENIGN
    severity = Column(String(30), nullable=False)            # CRITICAL, HIGH, MEDIUM, LOW
    attack_category = Column(String(100), nullable=True)
    decision_rule = Column(String(100), nullable=True)
    model_scores = Column(Text, nullable=True)               # JSON string
    supporting_evidence = Column(Text, nullable=True)        # JSON string
    is_matched = Column(Integer, nullable=False, default=1)  # 1 if correlated to asset, 0 if unmatched
    raw_event_data = Column(Text, nullable=True)             # JSON string of the incoming flow
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        scores = {}
        if self.model_scores:
            try:
                scores = json.loads(self.model_scores)
            except Exception:
                scores = {}
        evidence = {}
        if self.supporting_evidence:
            try:
                evidence = json.loads(self.supporting_evidence)
            except Exception:
                evidence = {}
        raw = {}
        if self.raw_event_data:
            try:
                raw = json.loads(self.raw_event_data)
            except Exception:
                raw = {}
        return {
            "id": self.id,
            "asset_id": self.asset_id,
            "detection_id": self.detection_id,
            "threat_status": self.threat_status,
            "severity": self.severity,
            "attack_category": self.attack_category,
            "decision_rule": self.decision_rule,
            "model_scores": scores,
            "supporting_evidence": evidence,
            "is_matched": bool(self.is_matched),
            "raw_event_data": raw,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class SimulationScenarioRecord(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(50), nullable=False)
    active = Column(Integer, nullable=False, default=0)
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        payload = {}
        if self.payload_json:
            try:
                payload = json.loads(self.payload_json)
            except Exception:
                payload = {}
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "scenario_type": self.scenario_type,
            "active": bool(self.active),
            "payload": payload,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AttackPathPredictionRecord(Base):
    __tablename__ = "attack_path_predictions"

    id = Column(String(50), primary_key=True, index=True)
    source_asset_id = Column(String(50), nullable=False, index=True)
    target_asset_id = Column(String(50), nullable=True, index=True)
    topology_snapshot = Column(String(100), nullable=True)
    total_paths = Column(Integer, nullable=False, default=0)
    highest_risk_score = Column(Float, nullable=False, default=0.0)
    risk_category = Column(String(30), nullable=False, default="MEDIUM")
    paths_json = Column(Text, nullable=False)
    chokepoints_json = Column(Text, nullable=True)
    scoring_version = Column(String(50), nullable=False, default="OMEN-AP-2.1")
    is_simulation = Column(Integer, nullable=False, default=1)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        paths = []
        if self.paths_json:
            try:
                paths = json.loads(self.paths_json)
            except Exception:
                paths = []
        chokepoints = []
        if self.chokepoints_json:
            try:
                chokepoints = json.loads(self.chokepoints_json)
            except Exception:
                chokepoints = []
        meta = {}
        if self.metadata_json:
            try:
                meta = json.loads(self.metadata_json)
            except Exception:
                meta = {}
        return {
            "prediction_id": self.id,
            "id": self.id,
            "source_asset_id": self.source_asset_id,
            "target_asset_id": self.target_asset_id,
            "topology_snapshot": self.topology_snapshot,
            "total_paths": self.total_paths,
            "highest_risk_score": self.highest_risk_score,
            "risk_category": self.risk_category,
            "paths": paths,
            "critical_chokepoints": chokepoints,
            "scoring_version": self.scoring_version,
            "is_simulation": bool(self.is_simulation),
            "metadata": meta,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DefenseSimulationRecord(Base):
    __tablename__ = "defense_simulations"

    id = Column(String(50), primary_key=True, index=True)
    prediction_id = Column(String(50), nullable=True, index=True)
    topology_snapshot = Column(String(100), nullable=True)
    action_type = Column(String(50), nullable=False)
    target_entity = Column(String(100), nullable=False)
    risk_before = Column(Float, nullable=False, default=0.0)
    risk_after = Column(Float, nullable=False, default=0.0)
    risk_reduction_pct = Column(Float, nullable=False, default=0.0)
    disruption_score = Column(Float, nullable=False, default=0.0)
    containment_efficacy = Column(Float, nullable=False, default=0.0)
    approval_status = Column(String(30), nullable=False, default="PENDING")
    details_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {}
        return {
            "id": self.id,
            "simulation_id": self.id,
            "prediction_id": self.prediction_id,
            "topology_snapshot": self.topology_snapshot,
            "action_type": self.action_type,
            "target_entity": self.target_entity,
            "risk_before": self.risk_before,
            "risk_after": self.risk_after,
            "risk_reduction_pct": self.risk_reduction_pct,
            "disruption_score": self.disruption_score,
            "containment_efficacy": self.containment_efficacy,
            "approval_status": self.approval_status,
            "details": details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DefenseApprovalRecord(Base):
    __tablename__ = "defense_approvals"

    id = Column(String(50), primary_key=True, index=True)
    simulation_id = Column(String(50), nullable=False, index=True)
    analyst_id = Column(String(50), nullable=False, default="secops_operator")
    decision = Column(String(30), nullable=False, default="APPROVED")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "simulation_id": self.simulation_id,
            "analyst_id": self.analyst_id,
            "decision": self.decision,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), nullable=False, index=True)
    author = Column(String(50), nullable=False, default="SecOps Analyst")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "author": self.author,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed initial sample incidents if database is empty
        if db.query(Incident).count() == 0:
            initial_incidents = [
                Incident(
                    id="INC-2026-0891",
                    title="Anomalous Lateral Kerberoasting Probe",
                    severity="HIGH",
                    status="INVESTIGATING",
                    description="Unusual TGS ticket requests detected from WS-Dev-04 toward Domain Controller DC-01.",
                    affected_nodes=json.dumps(["ws-dev-04", "dc-01"]),
                    mitre_technique="T1558.003 - Kerberoasting",
                    created_at=datetime.now(timezone.utc),
                ),
                Incident(
                    id="INC-2026-0892",
                    title="External Ingress Port-Scan Burst",
                    severity="MEDIUM",
                    status="CONTAINED",
                    description="Rapid SYN scan on ports 445, 3389 targeting DMZ gateway.",
                    affected_nodes=json.dumps(["gw-ext-01", "fw-dmz-01"]),
                    mitre_technique="T1046 - Network Service Discovery",
                    created_at=datetime.now(timezone.utc),
                ),
                Incident(
                    id="INC-2026-0893",
                    title="Autonomous Isolation Simulation Pre-Validation",
                    severity="LOW",
                    status="RESOLVED",
                    description="Simulated zero-trust quarantine of WS-Ops-05 to verify blast-radius mitigation.",
                    affected_nodes=json.dumps(["ws-ops-05"]),
                    mitre_technique="T1021.002 - SMB/Windows Admin Shares",
                    created_at=datetime.now(timezone.utc),
                ),
            ]
            db.add_all(initial_incidents)
            db.commit()

        # Seed initial network assets & relationships if empty
        if db.query(NetworkAssetRecord).count() == 0:
            from backend.graph_engine.topology import DEVICE_DATA, EDGE_DATA
            for dev in DEVICE_DATA:
                status = "COMPROMISED" if dev.get("compromised") else ("ISOLATED" if dev.get("isolated") else "SECURE")
                rec = NetworkAssetRecord(
                    id=dev["id"],
                    name=dev["name"],
                    asset_type=dev.get("device_type", "workstation"),
                    zone=dev.get("zone", "Corporate"),
                    subnet=dev.get("subnet"),
                    ip=dev.get("ip"),
                    criticality=dev.get("criticality", "MEDIUM"),
                    security_status=status,
                    vulnerabilities=json.dumps(dev.get("vulnerabilities", [])),
                    vuln_score=float(dev.get("vuln_score", 0.0)),
                    isolated=1 if dev.get("isolated") else 0,
                    last_activity=datetime.now(timezone.utc),
                    metadata_json=json.dumps({"source": "SYNTHETIC_ENTERPRISE_TOPOLOGY"}),
                )
                db.add(rec)

            for idx, edge in enumerate(EDGE_DATA):
                rel = NetworkRelationshipRecord(
                    id=f"rel-{edge['source']}-{edge['target']}-{idx}",
                    source_id=edge["source"],
                    target_id=edge["target"],
                    relationship_type=edge.get("relationship_type", "NETWORK_FLOW"),
                    direction="DIRECTED",
                    protocol=edge.get("protocol", "TCP"),
                    port=edge.get("port", 0),
                    weight=float(edge.get("weight", 1.0)),
                    access_permissions=edge.get("access_permissions") or f"ALLOW {edge.get('protocol', 'TCP')}/{edge.get('port', 0)}",
                    observation_source=edge.get("observation_source", "NETFLOW_TELEMETRY"),
                )
                db.add(rel)

            db.commit()
    finally:
        db.close()
