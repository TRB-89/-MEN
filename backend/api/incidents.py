import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database.db import get_db, Incident, SecurityEvent, SimulationRun

router = APIRouter(prefix="/incidents", tags=["Incident Memory & Audit"])


class IncidentCreate(BaseModel):
    title: str = Field(..., json_schema_extra={"example": "Lateral Movement via WinRM Detected"})
    severity: str = Field(default="MEDIUM", json_schema_extra={"example": "HIGH"})
    status: str = Field(default="OPEN", json_schema_extra={"example": "OPEN"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Suspicious connection pattern observed"})
    affected_nodes: List[str] = Field(default=[], json_schema_extra={"example": ["ws-dev-04", "dc-01"]})
    mitre_technique: Optional[str] = Field(None, json_schema_extra={"example": "T1021.002 - SMB/Admin Shares"})


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    affected_nodes: Optional[List[str]] = None


@router.get("")
def list_incidents(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    status: Optional[str] = Query(None, description="Filter by status: OPEN, INVESTIGATING, CONTAINED, RESOLVED"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List recorded cyber incidents with optional severity and status filters."""
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    if status:
        query = query.filter(Incident.status == status.upper())

    total = query.count()
    items = query.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "incidents": [item.to_dict() for item in items],
    }


@router.post("", status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    """Log a new cybersecurity incident."""
    inc = Incident(
        id=f"INC-{uuid.uuid4().hex[:8].upper()}",
        title=payload.title,
        severity=payload.severity.upper(),
        status=payload.status.upper(),
        description=payload.description,
        affected_nodes=json.dumps(payload.affected_nodes),
        mitre_technique=payload.mitre_technique,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc.to_dict()


@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return inc.to_dict()


@router.patch("/{incident_id}")
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)):
    """Update status, severity, or details of an existing incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    if payload.title is not None:
        inc.title = payload.title
    if payload.severity is not None:
        inc.severity = payload.severity.upper()
    if payload.status is not None:
        inc.status = payload.status.upper()
    if payload.description is not None:
        inc.description = payload.description
    if payload.affected_nodes is not None:
        inc.affected_nodes = json.dumps(payload.affected_nodes)

    inc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inc)
    return inc.to_dict()


from backend.database.db import get_db, Incident, SecurityEvent, SimulationRun, AttackPathPredictionRecord, DefenseSimulationRecord


@router.get("/export/json")
def export_incidents_json(db: Session = Depends(get_db)):
    """Export complete immutable forensic dossier of incidents and security events."""
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(100).all()
    simulations = db.query(DefenseSimulationRecord).order_by(DefenseSimulationRecord.created_at.desc()).limit(50).all()

    return {
        "export_metadata": {
            "system": "ØMEN // BLACKSITE IMMUTABLE FORENSIC ARCHIVE",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "incidents_count": len(incidents),
            "events_count": len(events),
            "simulations_count": len(simulations),
        },
        "incidents": [inc.to_dict() for inc in incidents],
        "security_events": [e.to_dict() for e in events],
        "defense_simulations": [s.to_dict() for s in simulations],
    }


@router.get("/timeline/replay")
def get_attack_replay_timeline(
    incident_id: Optional[str] = Query(None, description="Optional incident ID filter"),
    db: Session = Depends(get_db),
):
    """Retrieve chronologically ordered events for the interactive Attack Replay Timeline."""
    events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.asc()).limit(100).all()
    predictions = db.query(AttackPathPredictionRecord).order_by(AttackPathPredictionRecord.timestamp.asc()).limit(20).all()
    simulations = db.query(DefenseSimulationRecord).order_by(DefenseSimulationRecord.created_at.asc()).limit(20).all()

    timeline_items = []

    # Map security events
    for e in events:
        parsed_evidence = {}
        try:
            parsed_evidence = json.loads(e.supporting_evidence) if e.supporting_evidence else {}
        except Exception:
            pass

        timeline_items.append({
            "id": f"EVT-{e.id}",
            "event_type": "OBSERVED_EVENT",
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.now(timezone.utc).isoformat(),
            "source_asset": e.asset_id or "srv-web-01",
            "related_assets": [e.asset_id] if e.asset_id else ["srv-web-01"],
            "severity": e.severity,
            "threat_status": e.threat_status,
            "category": e.attack_category or "Anomaly / Intrusion",
            "decision_rule": e.decision_rule or "Neural Consensus",
            "rf_probability": e.rf_probability,
            "mlp_probability": e.mlp_probability,
            "anomaly_index": e.anomaly_index,
            "evidence": parsed_evidence,
            "mitre_technique": "T1190 - Exploit Public-Facing Application" if e.severity == "CRITICAL" else "T1046 - Network Service Discovery",
        })

    # Map attack predictions
    for p in predictions:
        parsed_paths = []
        try:
            parsed_paths = json.loads(p.candidate_paths) if p.candidate_paths else []
        except Exception:
            pass

        timeline_items.append({
            "id": f"PRED-{p.prediction_id}",
            "event_type": "PREDICTED_PATH",
            "timestamp": p.timestamp.isoformat() if p.timestamp else datetime.now(timezone.utc).isoformat(),
            "source_asset": p.source_asset_id,
            "related_assets": [p.source_asset_id, p.target_asset_id] if p.target_asset_id else [p.source_asset_id],
            "severity": "HIGH",
            "threat_status": "HYPOTHETICAL_CORRIDOR",
            "category": "Attack Traversal Forecast",
            "decision_rule": f"Graph Traversal v{p.scoring_version}",
            "rf_probability": None,
            "mlp_probability": None,
            "anomaly_index": p.highest_risk_score,
            "evidence": {"total_paths": p.total_paths, "highest_risk": p.highest_risk_score, "paths": parsed_paths},
            "mitre_technique": "T1021 - Lateral Movement",
        })

    # Map defense simulations
    for s in simulations:
        timeline_items.append({
            "id": f"SIM-{s.simulation_id}",
            "event_type": "SIMULATED_DEFENSE",
            "timestamp": s.created_at.isoformat() if s.created_at else datetime.now(timezone.utc).isoformat(),
            "source_asset": s.entry_node,
            "related_assets": [s.target_entity, s.crown_jewel_target] if s.crown_jewel_target else [s.target_entity],
            "severity": "LOW",
            "threat_status": "CONTAINMENT_SIMULATED",
            "category": f"Defense Action: {s.action_type}",
            "decision_rule": f"Risk Reduction: {s.risk_reduction_pct:.1f}%",
            "rf_probability": None,
            "mlp_probability": None,
            "anomaly_index": s.risk_score_after,
            "evidence": {
                "action_type": s.action_type,
                "target_entity": s.target_entity,
                "net_utility": s.net_utility_score,
                "approval_status": s.approval_status,
            },
            "mitre_technique": "M1037 - Filter Network Traffic",
        })

    # Sort deterministically by timestamp
    timeline_items.sort(key=lambda x: x["timestamp"])

    return {
        "count": len(timeline_items),
        "timeline": timeline_items,
    }
