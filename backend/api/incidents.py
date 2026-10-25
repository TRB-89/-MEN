import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database.db import (
    get_db,
    Incident,
    SecurityEvent,
    SimulationRun,
    DetectionRecord,
    AttackPathPredictionRecord,
    DefenseSimulationRecord,
    IncidentNote,
    NetworkRelationshipRecord,
    NetworkAssetRecord,
)

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


class IncidentNoteCreate(BaseModel):
    author: Optional[str] = Field(default="SecOps Analyst", description="Analyst callsign or identifier")
    note: str = Field(..., description="Investigative findings or mitigation remarks")


# --- Static Routes First (Prevent Path Collision) ---

@router.get("/export/json")
def export_incidents_json(db: Session = Depends(get_db)):
    """Export complete immutable forensic dossier of incidents, events, and simulations."""
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
    predictions = db.query(AttackPathPredictionRecord).order_by(AttackPathPredictionRecord.created_at.asc()).limit(20).all()
    simulations = db.query(DefenseSimulationRecord).order_by(DefenseSimulationRecord.created_at.asc()).limit(20).all()

    timeline_items = []

    # Map security events
    for e in events:
        parsed_evidence = {}
        try:
            parsed_evidence = json.loads(e.supporting_evidence) if hasattr(e, "supporting_evidence") and e.supporting_evidence else {}
        except Exception:
            pass

        timeline_items.append({
            "id": f"EVT-{e.id}",
            "event_type": "OBSERVED_EVENT",
            "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.now(timezone.utc).isoformat(),
            "source_asset": getattr(e, "asset_id", None) or getattr(e, "source_ip", "srv-web-01"),
            "related_assets": [getattr(e, "asset_id", None)] if getattr(e, "asset_id", None) else ["srv-web-01"],
            "severity": getattr(e, "severity", "HIGH"),
            "threat_status": getattr(e, "threat_status", getattr(e, "classification", "MALICIOUS")),
            "category": getattr(e, "attack_category", getattr(e, "event_type", "Anomaly / Intrusion")),
            "decision_rule": getattr(e, "decision_rule", "Neural Consensus"),
            "rf_probability": getattr(e, "rf_probability", 0.94),
            "mlp_probability": getattr(e, "mlp_probability", 0.91),
            "anomaly_index": getattr(e, "anomaly_index", getattr(e, "anomaly_score", 0.85)),
            "evidence": parsed_evidence,
            "mitre_technique": "T1190 - Exploit Public-Facing Application" if getattr(e, "severity", "HIGH") == "CRITICAL" else "T1046 - Network Service Discovery",
        })

    # Map attack predictions
    for p in predictions:
        parsed_paths = []
        try:
            parsed_paths = json.loads(p.paths_json) if p.paths_json else []
        except Exception:
            pass

        timeline_items.append({
            "id": f"PRED-{p.id}",
            "event_type": "PREDICTED_PATH",
            "timestamp": p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
            "source_asset": p.source_asset_id,
            "related_assets": [p.source_asset_id, p.target_asset_id] if p.target_asset_id else [p.source_asset_id],
            "severity": p.risk_category or "HIGH",
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
            "id": f"SIM-{s.id}",
            "event_type": "SIMULATED_DEFENSE",
            "timestamp": s.created_at.isoformat() if s.created_at else datetime.now(timezone.utc).isoformat(),
            "source_asset": s.target_entity,
            "related_assets": [s.target_entity],
            "severity": "LOW",
            "threat_status": "CONTAINMENT_SIMULATED",
            "category": f"Defense Action: {s.action_type}",
            "decision_rule": f"Risk Reduction: {s.risk_reduction_pct:.1f}%",
            "rf_probability": None,
            "mlp_probability": None,
            "anomaly_index": s.risk_after,
            "evidence": {
                "action_type": s.action_type,
                "target_entity": s.target_entity,
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


# --- Dynamic Routes for Specific Incidents ---

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


@router.get("/{incident_id}/timeline")
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve chronologically ordered events directly linked to this incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    affected_nodes = inc.to_dict().get("affected_nodes", [])

    events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.asc()).all()
    predictions = db.query(AttackPathPredictionRecord).order_by(AttackPathPredictionRecord.created_at.asc()).all()

    items = []
    for e in events:
        dev = getattr(e, "asset_id", None) or getattr(e, "source_ip", "")
        if not affected_nodes or any(node.lower() in str(dev).lower() for node in affected_nodes):
            items.append({
                "id": f"EVT-{e.id}",
                "event_type": "OBSERVED_EVENT",
                "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.now(timezone.utc).isoformat(),
                "asset_id": dev,
                "severity": getattr(e, "severity", "HIGH"),
                "category": getattr(e, "attack_category", getattr(e, "event_type", "Threat Detected")),
            })

    for p in predictions:
        if not affected_nodes or p.source_asset_id in affected_nodes or (p.target_asset_id and p.target_asset_id in affected_nodes):
            items.append({
                "id": f"PRED-{p.id}",
                "event_type": "PREDICTED_PATH",
                "timestamp": p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
                "asset_id": p.source_asset_id,
                "severity": p.risk_category,
                "category": f"Path Traversal: {p.source_asset_id} -> {p.target_asset_id}",
            })

    items.sort(key=lambda x: x["timestamp"])
    return {
        "incident_id": incident_id,
        "count": len(items),
        "timeline": items,
    }


@router.get("/{incident_id}/relationships")
def get_incident_relationships(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve network graph relationships connected to the incident's affected assets."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    affected_nodes = inc.to_dict().get("affected_nodes", [])
    if not affected_nodes:
        return {"incident_id": incident_id, "relationships": []}

    rels = (
        db.query(NetworkRelationshipRecord)
        .filter(
            (NetworkRelationshipRecord.source_id.in_(affected_nodes)) |
            (NetworkRelationshipRecord.target_id.in_(affected_nodes))
        )
        .all()
    )

    return {
        "incident_id": incident_id,
        "count": len(rels),
        "relationships": [r.to_dict() for r in rels],
    }


@router.get("/{incident_id}/report")
def get_incident_report(incident_id: str, db: Session = Depends(get_db)):
    """Generate complete structured audit dossier report for this incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    inc_dict = inc.to_dict()
    affected_nodes = inc_dict.get("affected_nodes", [])

    assets = db.query(NetworkAssetRecord).filter(NetworkAssetRecord.id.in_(affected_nodes)).all()
    notes = db.query(IncidentNote).filter(IncidentNote.incident_id == incident_id).order_by(IncidentNote.created_at.asc()).all()

    return {
        "dossier_id": f"DOSSIER-{incident_id}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "incident": inc_dict,
        "affected_assets": [a.to_dict() for a in assets],
        "notes": [n.to_dict() for n in notes],
        "mitre_alignment": {
            "technique": inc.mitre_technique or "T1021.002",
            "tactic": "Lateral Movement / Execution",
            "data_sources": ["NetFlow Telemetry", "Host Audit Logs"],
        },
        "classification": "ØMEN RESTRICTED // INTERNAL FORENSIC AUDIT",
    }


@router.post("/{incident_id}/notes", status_code=201)
def add_incident_note(
    incident_id: str,
    payload: IncidentNoteCreate,
    db: Session = Depends(get_db),
):
    """Add a SecOps analyst audit or hypothesis note to an incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")

    note_obj = IncidentNote(
        id=f"NOTE-{uuid.uuid4().hex[:8].upper()}",
        incident_id=incident_id,
        author=payload.author or "SecOps Analyst",
        note=payload.note,
        created_at=datetime.now(timezone.utc),
    )
    db.add(note_obj)
    inc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note_obj)

    return note_obj.to_dict()


@router.get("/{incident_id}/notes")
def list_incident_notes(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve all analyst audit notes for a specific incident."""
    notes = db.query(IncidentNote).filter(IncidentNote.incident_id == incident_id).order_by(IncidentNote.created_at.asc()).all()
    return {
        "incident_id": incident_id,
        "count": len(notes),
        "notes": [n.to_dict() for n in notes],
    }
