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


@router.get("/simulations/history")
def list_simulation_runs(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """List historical autonomous defense simulation runs."""
    runs = db.query(SimulationRun).order_by(SimulationRun.timestamp.desc()).limit(limit).all()
    return {
        "count": len(runs),
        "simulations": [r.to_dict() for r in runs],
    }


@router.get("/events/history")
def list_security_events(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """List logged network anomaly and threat events."""
    events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    return {
        "count": len(events),
        "events": [e.to_dict() for e in events],
    }
