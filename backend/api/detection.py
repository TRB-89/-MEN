"""FastAPI Endpoints for Module 1: Neural Threat Detection Engine.

Provides endpoints for unified threat analysis, model metadata, measured metrics,
detection history retrieval, engine health, and CSV flow uploads.
"""

import os
import json
import io
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from backend.detection.threat_engine import (
    threat_engine,
    NetworkFlowEvent,
    StructuredThreatAlert,
    MODELS_DIR,
    RF_PATH,
    MLP_WEIGHTS_PATH,
    MLP_CONFIG_PATH,
    ISO_PATH,
    PREPROCESSOR_PATH,
)
from backend.detection.preprocessor import load_unsw_dataset
from backend.database.db import get_db, DetectionRecord, SecurityEvent

router = APIRouter(prefix="/detection", tags=["Threat Detection (Module 1)"])


# --- Step 6 Required Endpoints ---

@router.post("/analyze", response_model=StructuredThreatAlert)
def analyze_network_event(event: NetworkFlowEvent, db: Session = Depends(get_db)):
    """Unified threat analysis evaluating incoming network flows against all three models."""
    try:
        alert = threat_engine.analyze_event(event)

        # Persist or update detection record in SQLite Incident Memory
        existing = db.query(DetectionRecord).filter(DetectionRecord.detection_id == alert.event_id).first()
        if existing:
            existing.event_timestamp = alert.timestamp
            existing.device_id = alert.device_id
            existing.threat_status = alert.threat_status
            existing.detected_attack_cat = alert.attack_category
            existing.rf_score = alert.model_scores.get("rf_probability")
            existing.mlp_score = alert.model_scores.get("mlp_probability")
            existing.anomaly_score = alert.model_scores.get("anomaly_index")
            existing.alert_severity = alert.severity
            existing.decision_rule = alert.decision_rule
            existing.supporting_evidence = json.dumps(alert.supporting_evidence)
            existing.model_version = json.dumps(alert.model_versions)
            existing.processing_timestamp = datetime.now(timezone.utc)
        else:
            record = DetectionRecord(
                detection_id=alert.event_id,
                event_timestamp=alert.timestamp,
                device_id=alert.device_id,
                threat_status=alert.threat_status,
                detected_attack_cat=alert.attack_category,
                rf_score=alert.model_scores.get("rf_probability"),
                mlp_score=alert.model_scores.get("mlp_probability"),
                anomaly_score=alert.model_scores.get("anomaly_index"),
                alert_severity=alert.severity,
                decision_rule=alert.decision_rule,
                supporting_evidence=json.dumps(alert.supporting_evidence),
                model_version=json.dumps(alert.model_versions),
                processing_timestamp=datetime.now(timezone.utc),
            )
            db.add(record)
        db.commit()

        # Connect Module 1 to Module 2: Correlate event to network asset in SQLite
        try:
            from backend.graph_engine.topology import correlate_event_to_asset
            correlate_event_to_asset(db, alert.model_dump(), event.model_dump())
        except Exception as corr_err:
            # Non-blocking logger if correlation throws
            pass

        return alert
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Inference analysis failure: {str(e)}")


@router.get("/models")
def get_models_status():
    """Return runtime status, artifacts, and configuration for all three models."""
    threat_engine.reload_all_models()
    models_state = threat_engine.models_loaded

    # Preprocessor info
    preprocessor_info = {"status": "trained" if threat_engine.preprocessor is not None else "not_trained"}
    if threat_engine.preprocessor:
        preprocessor_info.update({
            "raw_features_count": len(threat_engine.preprocessor.numeric_columns) + len(threat_engine.preprocessor.categorical_columns),
            "transformed_features_dim": len(threat_engine.preprocessor.feature_names_out),
            "artifact_path": PREPROCESSOR_PATH,
        })

    # MLP Config
    mlp_config = {}
    if os.path.exists(MLP_CONFIG_PATH):
        try:
            with open(MLP_CONFIG_PATH, "r", encoding="utf-8") as f:
                mlp_config = json.load(f)
        except Exception:
            pass

    return {
        "engine": "ØMEN Neural Threat Detection Engine (Module 1)",
        "models": {
            "random_forest": {
                "name": "Random Forest Classifier",
                "type": "Supervised Baseline Classifier",
                "framework": "scikit-learn",
                "status": "trained" if models_state["random_forest"] else "not_trained",
                "artifact_path": RF_PATH if models_state["random_forest"] else None,
                "role": "Supervised feature pattern matching and probabilistic voting",
            },
            "mlp_neural_network": {
                "name": "Deep Multilayer Perceptron (MLP)",
                "type": "Neural Network Classifier",
                "framework": "PyTorch",
                "status": "trained" if models_state["mlp_neural_network"] else "not_trained",
                "weights_path": MLP_WEIGHTS_PATH if models_state["mlp_neural_network"] else None,
                "architecture": {
                    "input_dim": mlp_config.get("input_dim", 191),
                    "hidden_layers": [128, 64],
                    "activations": ["ReLU", "ReLU"],
                    "dropout": [0.3, 0.2],
                    "output": "Binary Sigmoid Logit",
                },
                "role": "Nonlinear representation learning and high-assurance attack probability",
            },
            "isolation_forest": {
                "name": "Isolation Forest Anomaly Detector",
                "type": "Unsupervised Normal Baseline Modeler",
                "framework": "scikit-learn",
                "status": "trained" if models_state["isolation_forest"] else "not_trained",
                "artifact_path": ISO_PATH if models_state["isolation_forest"] else None,
                "calibrated_threshold": threat_engine.iso_threshold,
                "role": "Supporting anomaly evidence via distance from baseline normal traffic",
            },
        },
        "preprocessor": preprocessor_info,
        "all_models_ready": all(models_state.values()),
        "model_loaded": any(models_state.values()),
        "supported_classes": ["Normal", "Generic", "Exploits", "Fuzzers", "DoS", "Reconnaissance", "Analysis", "Backdoor", "Shellcode", "Worms"],
    }


@router.get("/metrics")
def get_model_metrics():
    """Return actual measured evaluation metrics for all trained models."""
    metrics_files = {
        "random_forest": os.path.join(MODELS_DIR, "rf_metrics.json"),
        "mlp_neural_network": os.path.join(MODELS_DIR, "mlp_metrics.json"),
        "isolation_forest": os.path.join(MODELS_DIR, "isolation_forest_metrics.json"),
        "all_metrics": os.path.join(MODELS_DIR, "all_metrics.json"),
    }

    results = {}
    for model_key, path in metrics_files.items():
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    results[model_key] = json.load(f)
            except Exception as e:
                results[model_key] = {"status": "error", "detail": str(e)}
        else:
            results[model_key] = {
                "status": "not_trained",
                "message": f"Metrics artifact not found. Please train {model_key} first.",
            }

    return {
        "evaluation_dataset": "UNSW-NB15 (Holdout Test Set)",
        "models": results,
    }


@router.get("/history")
def get_detection_history(
    severity: Optional[str] = Query(None, description="Filter: CRITICAL, HIGH, MEDIUM, LOW"),
    threat_status: Optional[str] = Query(None, description="Filter: MALICIOUS, SUSPICIOUS, BENIGN"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve historical threat detections with filtering and pagination."""
    query = db.query(DetectionRecord)

    if severity:
        query = query.filter(DetectionRecord.alert_severity == severity.upper())
    if threat_status:
        query = query.filter(DetectionRecord.threat_status == threat_status.upper())
    if device_id:
        query = query.filter(DetectionRecord.device_id == device_id)

    total = query.count()
    records = query.order_by(DetectionRecord.processing_timestamp.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": [r.to_dict() for r in records],
    }


@router.get("/health")
def get_detection_health():
    """Telemetry health check returning model states and dataset readiness."""
    threat_engine.reload_all_models()
    models_state = threat_engine.models_loaded
    _, _, dataset_found = load_unsw_dataset()

    return {
        "status": "online" if any(models_state.values()) else "uninitialized",
        "subsystem": "ØMEN Neural Threat Detection Engine (Module 1)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": models_state,
        "dataset_available": dataset_found,
        "preprocessor_ready": threat_engine.preprocessor is not None,
    }


# --- Backward Compatibility / Telemetry Endpoints ---

@router.get("/model-status")
def get_legacy_model_status():
    """Legacy endpoint compatibility alias."""
    return get_models_status()


@router.post("/upload")
async def upload_csv_flows(file: UploadFile = File(...)):
    """Parse uploaded CSV of network flows and execute batch inference."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {e}")

    preview_predictions = []
    normal_count = 0
    attack_count = 0
    severity_dist = {"Normal": 0, "Low": 0, "Medium": 0, "High": 0}

    max_eval = min(len(df), 200)
    for idx in range(max_eval):
        row = df.iloc[idx].to_dict()
        event = NetworkFlowEvent(
            event_id=f"CSV-{idx+1:04d}",
            device_id=str(row.get("device_id", "ws-monitored")),
            proto=str(row.get("proto", "tcp")).lower(),
            service=str(row.get("service", "-")).lower(),
            state=str(row.get("state", "FIN")),
            dur=float(row.get("dur", 0.1)),
            spkts=int(row.get("spkts", 10)),
            dpkts=int(row.get("dpkts", 8)),
            sbytes=int(row.get("sbytes", 800)),
            dbytes=int(row.get("dbytes", 1200)),
            rate=float(row.get("rate", 100.0)),
            sttl=int(row.get("sttl", 64)),
            dttl=int(row.get("dttl", 64)),
        )

        alert = threat_engine.analyze_event(event)
        is_attack = alert.threat_status == "MALICIOUS"
        if is_attack:
            attack_count += 1
        else:
            normal_count += 1

        sev_key = "Normal" if not is_attack else ("High" if alert.severity in ("HIGH", "CRITICAL") else "Medium")
        severity_dist[sev_key] = severity_dist.get(sev_key, 0) + 1

        if len(preview_predictions) < 25:
            score = alert.model_scores.get("rf_probability") or alert.model_scores.get("mlp_probability") or 0.5
            preview_predictions.append({
                "prediction": alert.threat_status,
                "class_id": 1 if is_attack else 0,
                "attack_score": score,
                "threshold": alert.decision_threshold,
                "severity": sev_key,
                "model": "ØMEN Ensemble (RF+MLP+IsoForest)",
                "timestamp": alert.timestamp,
            })

    total = normal_count + attack_count
    pct = round((attack_count / max(1, total)) * 100.0, 2)

    return {
        "status": "success",
        "total_records_analyzed": total,
        "normal_traffic_count": normal_count,
        "potential_attack_count": attack_count,
        "attack_percentage": pct,
        "severity_distribution": severity_dist,
        "preview_limit": 25,
        "preview_predictions": preview_predictions,
    }
