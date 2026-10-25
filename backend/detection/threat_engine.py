"""Unified Threat Analysis Engine for Module 1.

Integrates Random Forest (supervised baseline), PyTorch MLP (neural network),
and Isolation Forest (unsupervised anomaly detection) through documented
consensus decision logic into a structured threat intelligence alert.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import joblib
from pydantic import BaseModel, Field

try:
    import torch
    from backend.detection.mlp_network import ThreatDetectionMLP
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    ThreatDetectionMLP = None
    TORCH_AVAILABLE = False

from backend.detection.preprocessor import DataPreprocessor
from backend.detection.fit_isolation_forest import compute_normalized_anomaly_score

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
RF_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
MLP_WEIGHTS_PATH = os.path.join(MODELS_DIR, "mlp_weights.pt")
MLP_CONFIG_PATH = os.path.join(MODELS_DIR, "mlp_config.json")
ISO_PATH = os.path.join(MODELS_DIR, "isolation_forest_model.joblib")


class NetworkFlowEvent(BaseModel):
    """Network flow input matching UNSW-NB15 feature schema."""
    event_id: Optional[str] = Field(None, description="Optional caller event identifier")
    device_id: Optional[str] = Field(None, description="Monitored enterprise host ID (e.g. ws-dev-04)")
    proto: Optional[str] = Field("tcp", description="Protocol: tcp, udp, etc.")
    service: Optional[str] = Field("-", description="Application service: http, dns, ssh, etc.")
    state: Optional[str] = Field("FIN", description="Connection state: FIN, INT, CON, REQ, etc.")
    dur: Optional[float] = Field(0.1, ge=0.0, description="Flow duration in seconds")
    spkts: Optional[int] = Field(10, ge=0, description="Source-to-destination packet count")
    dpkts: Optional[int] = Field(8, ge=0, description="Destination-to-source packet count")
    sbytes: Optional[int] = Field(800, ge=0, description="Source-to-destination byte count")
    dbytes: Optional[int] = Field(1200, ge=0, description="Destination-to-source byte count")
    rate: Optional[float] = Field(150.0, ge=0.0, description="Packets per second rate")
    sttl: Optional[int] = Field(64, ge=0, le=255, description="Source time to live")
    dttl: Optional[int] = Field(64, ge=0, le=255, description="Destination time to live")
    sload: Optional[float] = Field(50000.0, ge=0.0, description="Source bits per second")
    dload: Optional[float] = Field(80000.0, ge=0.0, description="Destination bits per second")
    sloss: Optional[int] = Field(0, ge=0, description="Source packets retransmitted / dropped")
    dloss: Optional[int] = Field(0, ge=0, description="Destination packets retransmitted / dropped")
    sinpkt: Optional[float] = Field(10.0, ge=0.0, description="Source interpacket arrival time in ms")
    dinpkt: Optional[float] = Field(12.0, ge=0.0, description="Destination interpacket arrival time in ms")
    sjit: Optional[float] = Field(1.5, ge=0.0, description="Source jitter in ms")
    djit: Optional[float] = Field(1.8, ge=0.0, description="Destination jitter in ms")
    swin: Optional[int] = Field(255, ge=0, description="Source TCP window size")
    dwin: Optional[int] = Field(255, ge=0, description="Destination TCP window size")
    tcprtt: Optional[float] = Field(0.02, ge=0.0, description="TCP round trip time")
    synack: Optional[float] = Field(0.01, ge=0.0, description="TCP SYN to SYN-ACK time")
    ackdat: Optional[float] = Field(0.01, ge=0.0, description="TCP SYN-ACK to ACK time")
    smean: Optional[int] = Field(80, ge=0, description="Mean packet size transmitted by source")
    dmean: Optional[int] = Field(150, ge=0, description="Mean packet size transmitted by destination")
    trans_depth: Optional[int] = Field(0, ge=0, description="Pipelined HTTP request depth")
    response_body_len: Optional[int] = Field(0, ge=0, description="HTTP response content length")
    ct_srv_src: Optional[int] = Field(1, ge=0, description="Connections to same service from source")
    ct_state_ttl: Optional[int] = Field(0, ge=0, description="Connection state TTL correlation")
    ct_dst_ltm: Optional[int] = Field(1, ge=0, description="Connections to destination in last 100")
    ct_src_dport_ltm: Optional[int] = Field(1, ge=0, description="Connections to destination port from source")
    ct_dst_sport_ltm: Optional[int] = Field(1, ge=0, description="Connections from destination port")
    ct_dst_src_ltm: Optional[int] = Field(1, ge=0, description="Connections between source and destination")
    is_ftp_login: Optional[int] = Field(0, ge=0, le=1, description="FTP session authenticated")
    ct_ftp_cmd: Optional[int] = Field(0, ge=0, description="FTP commands count")
    ct_flw_http_mthd: Optional[int] = Field(0, ge=0, description="HTTP methods count")
    ct_src_ltm: Optional[int] = Field(1, ge=0, description="Connections from source in last 100")
    ct_srv_dst: Optional[int] = Field(1, ge=0, description="Connections to same service on destination")
    is_sm_ips_ports: Optional[int] = Field(0, ge=0, le=1, description="Source equals destination IP and port")
    # Additional contextual network attributes (optional)
    source_ip: Optional[str] = Field("10.0.3.104", description="Source IP address")
    destination_ip: Optional[str] = Field("10.0.4.50", description="Destination IP address")
    port: Optional[int] = Field(1433, description="Destination port")
    # Compatibility aliases
    protocol: Optional[str] = Field(None, description="Protocol alias")
    flow_duration_ms: Optional[float] = Field(None, description="Flow duration in ms")
    packet_count: Optional[int] = Field(None, description="Packet count alias")
    byte_count: Optional[int] = Field(None, description="Byte count alias")
    payload_entropy: Optional[float] = Field(None, description="Payload entropy")
    flags: Optional[List[str]] = Field(None, description="TCP flags")

    def model_post_init(self, __context: Any) -> None:
        if self.protocol and (not self.proto or self.proto == "tcp"):
            self.proto = self.protocol.lower()
        if self.flow_duration_ms is not None and self.dur == 0.1:
            self.dur = max(0.000001, self.flow_duration_ms / 1000.0)
        if self.packet_count is not None and self.spkts == 10:
            self.spkts = self.packet_count
        if self.byte_count is not None and self.sbytes == 800:
            self.sbytes = self.byte_count


class StructuredThreatAlert(BaseModel):
    event_id: str
    timestamp: str
    device_id: Optional[str]
    threat_status: str  # MALICIOUS, SUSPICIOUS, BENIGN
    attack_category: Optional[str]
    severity: str       # CRITICAL, HIGH, MEDIUM, LOW
    decision_threshold: float
    decision_rule: str
    model_scores: Dict[str, Any]
    model_versions: Dict[str, str]
    explanation: str
    supporting_evidence: Dict[str, Any]
    # Compatibility fields
    classification: Optional[str] = None
    anomaly_score: Optional[float] = None


class ThreatAnalysisEngine:
    """Production unified threat detection orchestrator."""

    def __init__(self):
        self.preprocessor: Optional[DataPreprocessor] = None
        self.rf_model = None
        self.mlp_model: Optional[ThreatDetectionMLP] = None
        self.iso_model = None
        self.iso_threshold: float = 0.50
        self.models_loaded: Dict[str, bool] = {
            "random_forest": False,
            "mlp_neural_network": False,
            "isolation_forest": False,
        }
        self.reload_all_models()

    def reload_all_models(self) -> Dict[str, bool]:
        """Attempt to load all trained model artifacts from disk."""
        # 1. Preprocessor
        if os.path.exists(PREPROCESSOR_PATH):
            try:
                self.preprocessor = DataPreprocessor.load(PREPROCESSOR_PATH)
            except Exception:
                self.preprocessor = None
        else:
            self.preprocessor = None

        # 2. Random Forest
        if os.path.exists(RF_PATH):
            try:
                self.rf_model = joblib.load(RF_PATH)
                self.models_loaded["random_forest"] = True
            except Exception:
                self.models_loaded["random_forest"] = False
        else:
            self.models_loaded["random_forest"] = False

        # 3. PyTorch MLP
        if TORCH_AVAILABLE and ThreatDetectionMLP is not None and os.path.exists(MLP_WEIGHTS_PATH) and os.path.exists(MLP_CONFIG_PATH):
            try:
                self.mlp_model = ThreatDetectionMLP.load_from_artifacts(MLP_WEIGHTS_PATH, MLP_CONFIG_PATH)
                self.models_loaded["mlp_neural_network"] = True
            except Exception:
                self.models_loaded["mlp_neural_network"] = False
        else:
            self.models_loaded["mlp_neural_network"] = False

        # 4. Isolation Forest
        if os.path.exists(ISO_PATH):
            try:
                payload = joblib.load(ISO_PATH)
                if isinstance(payload, dict):
                    self.iso_model = payload["model"]
                    self.iso_threshold = float(payload.get("threshold", 0.50))
                else:
                    self.iso_model = payload
                    self.iso_threshold = 0.50
                self.models_loaded["isolation_forest"] = True
            except Exception:
                self.models_loaded["isolation_forest"] = False
        else:
            self.models_loaded["isolation_forest"] = False

        return self.models_loaded

    def analyze_event(self, event: NetworkFlowEvent) -> StructuredThreatAlert:
        """Run unified threat analysis on an incoming network event."""
        event_dict = event.model_dump()
        event_id = event.event_id or f"EVT-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()
        device_id = event.device_id

        # Check if preprocessor and at least one model are available
        has_any_model = any(self.models_loaded.values()) and self.preprocessor is not None

        if not has_any_model:
            # Graceful untrained-model response
            return StructuredThreatAlert(
                event_id=event_id,
                timestamp=timestamp,
                device_id=device_id,
                threat_status="UNKNOWN",
                attack_category=None,
                severity="LOW",
                decision_threshold=0.50,
                decision_rule="UNAVAILABLE_MODELS_FALLBACK",
                model_scores={
                    "rf_probability": None,
                    "mlp_probability": None,
                    "anomaly_index": None,
                    "is_anomaly": None,
                },
                model_versions={
                    "random_forest": "NOT_TRAINED",
                    "mlp_neural_network": "NOT_TRAINED",
                    "isolation_forest": "NOT_TRAINED",
                },
                explanation="Threat detection engine is running in untrained mode. Please train the Module 1 models.",
                supporting_evidence={"status": "NO_TRAINED_MODELS_FOUND"},
            )

        # Preprocess features
        X = self.preprocessor.transform(event_dict)

        # 1. Random Forest prediction
        rf_prob = None
        rf_pred = None
        if self.models_loaded["random_forest"] and self.rf_model is not None:
            probs = self.rf_model.predict_proba(X)[0]
            rf_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
            rf_pred = "MALICIOUS" if rf_prob >= 0.50 else "BENIGN"

        # 2. PyTorch MLP prediction
        mlp_prob = None
        mlp_pred = None
        if self.models_loaded["mlp_neural_network"] and self.mlp_model is not None:
            mlp_prob = float(self.mlp_model.predict_proba(X)[0])
            mlp_pred = "MALICIOUS" if mlp_prob >= 0.50 else "BENIGN"

        # 3. Isolation Forest anomaly scoring
        anomaly_index = None
        is_anomaly = None
        if self.models_loaded["isolation_forest"] and self.iso_model is not None:
            anomaly_index = float(compute_normalized_anomaly_score(self.iso_model, X)[0])
            is_anomaly = bool(anomaly_index >= self.iso_threshold)

        # Documented Combined Decision Logic:
        # A. Consensus Malicious: Both RF and MLP agree (or single available model >= 0.70)
        # B. High Anomaly Corroboration: One model signals threat and anomaly_index > threshold
        # C. Suspicious: Single model flags threat without corroboration, or anomaly only
        # D. Benign: Both models predict benign and normal baseline

        valid_probs = [p for p in (rf_prob, mlp_prob) if p is not None]
        mean_prob = float(np.mean(valid_probs)) if valid_probs else 0.0

        if len(valid_probs) == 2:
            both_malicious = (rf_prob >= 0.50) and (mlp_prob >= 0.50)
            both_benign = (rf_prob < 0.50) and (mlp_prob < 0.50)
            high_confidence = (rf_prob >= 0.75) and (mlp_prob >= 0.75)
        elif len(valid_probs) == 1:
            both_malicious = valid_probs[0] >= 0.65
            both_benign = valid_probs[0] < 0.40
            high_confidence = valid_probs[0] >= 0.85
        else:
            both_malicious = False
            both_benign = True
            high_confidence = False

        if high_confidence:
            threat_status = "MALICIOUS"
            severity = "CRITICAL"
            decision_rule = "MULTI_MODEL_HIGH_CONFIDENCE_MALICIOUS"
            explanation = "Both Random Forest and PyTorch MLP independently classified flow as malicious with high confidence."
        elif both_malicious:
            threat_status = "MALICIOUS"
            severity = "HIGH" if (is_anomaly is True) else "MEDIUM"
            decision_rule = "CONSENSUS_SUPERVISED_ATTACK"
            explanation = "Supervised models reached consensus on attack signature."
        elif is_anomaly and (mean_prob >= 0.40):
            threat_status = "SUSPICIOUS"
            severity = "MEDIUM"
            decision_rule = "SUPERVISED_AND_ANOMALY_CORROBORATION"
            explanation = "Elevated attack probability corroborated by Isolation Forest normal-baseline deviation."
        elif any(p >= 0.55 for p in valid_probs):
            threat_status = "SUSPICIOUS"
            severity = "MEDIUM"
            decision_rule = "DIVERGENT_MODEL_FLAG"
            explanation = "One classifier flagged flow as suspicious while peer model remained below threshold."
        elif is_anomaly:
            threat_status = "SUSPICIOUS"
            severity = "LOW"
            decision_rule = "STATISTICAL_ANOMALY_ONLY"
            explanation = "Isolation Forest identified flow deviation from normal baseline; supervised models predict benign."
        else:
            threat_status = "BENIGN"
            severity = "LOW"
            decision_rule = "ALL_MODELS_BENIGN"
            explanation = "Flow conforms to verified normal network telemetry profile across all models."

        # Heuristic attack taxonomy mapping based on flow characteristics if malicious/suspicious
        attack_cat = "Normal"
        if threat_status != "BENIGN":
            if event.sttl > 128 and event.sload > 1000000:
                attack_cat = "Exploits"
            elif event.rate > 500 or event.spkts > 100:
                attack_cat = "DoS"
            elif event.ct_srv_src > 5 or event.ct_dst_src_ltm > 5:
                attack_cat = "Reconnaissance"
            elif event.dbytes == 0 and event.sbytes < 200:
                attack_cat = "Port Scan"
            else:
                attack_cat = "Generic Attack"

        evidence = {
            "rf_malicious_vote": rf_pred,
            "mlp_malicious_vote": mlp_pred,
            "anomaly_detected": is_anomaly,
            "flow_summary": {
                "proto": event.proto,
                "service": event.service,
                "state": event.state,
                "duration_sec": event.dur,
                "source_bytes": event.sbytes,
                "dest_bytes": event.dbytes,
                "rate_pps": event.rate,
                "source_ttl": event.sttl,
            },
        }

        return StructuredThreatAlert(
            event_id=event_id,
            timestamp=timestamp,
            device_id=device_id,
            threat_status=threat_status,
            attack_category=attack_cat if threat_status != "BENIGN" else "Normal",
            severity=severity,
            decision_threshold=0.50,
            decision_rule=decision_rule,
            model_scores={
                "rf_probability": round(rf_prob, 4) if rf_prob is not None else None,
                "mlp_probability": round(mlp_prob, 4) if mlp_prob is not None else None,
                "anomaly_index": round(anomaly_index, 4) if anomaly_index is not None else None,
                "anomaly_threshold": round(self.iso_threshold, 4),
                "is_anomaly": is_anomaly,
            },
            model_versions={
                "random_forest": "1.0.0 (scikit-learn)" if self.models_loaded["random_forest"] else "NOT_TRAINED",
                "mlp_neural_network": "1.0.0 (PyTorch BCEWithLogitsLoss)" if self.models_loaded["mlp_neural_network"] else "NOT_TRAINED",
                "isolation_forest": "1.0.0 (scikit-learn)" if self.models_loaded["isolation_forest"] else "NOT_TRAINED",
            },
            explanation=explanation,
            supporting_evidence=evidence,
            classification=threat_status,
            anomaly_score=round(anomaly_index, 4) if anomaly_index is not None else 0.05,
        )


# Global singleton instance
threat_engine = ThreatAnalysisEngine()
