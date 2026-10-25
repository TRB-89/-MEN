"""Threat Detection engine with Scikit-learn model integration and behavioral analysis.

Accepts validated security events, runs inference using a trained Scikit-learn classifier
when available, or deterministic heuristic behavioral rules when the model file is not present.
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import joblib
from pydantic import BaseModel, Field

logger = logging.getLogger("omen.detection")

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "models", "threat_detector.joblib"
)

# Supported classification classes
CLASSES = ["BENIGN", "PORT_SCAN", "BRUTE_FORCE", "EXPLOITATION", "LATERAL_MOVEMENT"]


class SecurityEventInput(BaseModel):
    source_ip: str = Field(..., json_schema_extra={"example": "198.51.100.45"})
    destination_ip: str = Field(..., json_schema_extra={"example": "10.0.1.10"})
    port: int = Field(..., ge=1, le=65535, json_schema_extra={"example": 443})
    protocol: str = Field(default="TCP", json_schema_extra={"example": "TCP"})
    flow_duration_ms: float = Field(default=120.0, ge=0.0, description="Flow duration in milliseconds")
    packet_count: int = Field(default=15, ge=1, description="Total packets in flow")
    byte_count: int = Field(default=2400, ge=0, description="Total bytes transferred")
    payload_entropy: float = Field(default=4.2, ge=0.0, le=8.0, description="Shannon entropy of payload")
    flags: List[str] = Field(default=["SYN", "ACK"], description="TCP flag signatures")


class DetectionResult(BaseModel):
    classification: str
    anomaly_score: float
    confidence: float
    threat_severity: str
    model_type: str
    model_loaded: bool
    mitre_technique: Optional[str] = None
    action_recommended: str
    details: Dict[str, Any]


class ThreatDetector:
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
        self.model = None
        self.model_loaded = False
        self.load_model()

    def load_model(self) -> bool:
        """Attempt to load trained Scikit-learn model from disk."""
        if os.path.exists(self.model_path):
            try:
                loaded = joblib.load(self.model_path)
                self.model = loaded.get("model", loaded)
                self.model_loaded = True
                logger.info(f"Loaded Scikit-learn threat model from {self.model_path}")
                return True
            except Exception as e:
                logger.warning(f"Failed to load model from {self.model_path}: {e}")
                self.model_loaded = False
        else:
            logger.info(f"No trained model artifact found at {self.model_path}. Using behavioral heuristic engine.")
            self.model_loaded = False
        return False

    def _extract_feature_vector(self, event: SecurityEventInput) -> np.ndarray:
        """Extract standardized numeric feature vector for model input."""
        flags_upper = [f.upper() for f in event.flags]
        has_syn = 1.0 if "SYN" in flags_upper else 0.0
        has_ack = 1.0 if "ACK" in flags_upper else 0.0
        has_fin = 1.0 if "FIN" in flags_upper else 0.0
        has_rst = 1.0 if "RST" in flags_upper else 0.0

        bytes_per_packet = event.byte_count / max(1, event.packet_count)
        packets_per_second = (event.packet_count / max(0.001, event.flow_duration_ms)) * 1000.0

        return np.array([
            float(event.port),
            float(event.flow_duration_ms),
            float(event.packet_count),
            float(event.byte_count),
            float(event.payload_entropy),
            has_syn,
            has_ack,
            has_fin,
            has_rst,
            bytes_per_packet,
            packets_per_second,
        ]).reshape(1, -1)

    def _heuristic_evaluate(self, event: SecurityEventInput) -> Tuple[str, float, float, str, Optional[str]]:
        """Transparent, documented deterministic behavioral analysis when model is not available."""
        score = 0.0
        classification = "BENIGN"
        mitre = None

        flags = [f.upper() for f in event.flags]
        is_syn_only = "SYN" in flags and "ACK" not in flags
        is_rst = "RST" in flags

        # Port scan signature: High frequency SYN with minimal duration & tiny packets
        if is_syn_only and event.flow_duration_ms < 50 and event.packet_count <= 2:
            score = 0.82
            classification = "PORT_SCAN"
            mitre = "T1046 - Network Service Discovery"

        # Brute-force signature: High packet volume, low payload size on auth ports
        elif event.port in (22, 3389, 445, 5985) and event.packet_count > 60 and event.flow_duration_ms < 2000:
            score = 0.88
            classification = "BRUTE_FORCE"
            mitre = "T1110 - Brute Force Authentication"

        # Exploitation / Shellcode signature: High Shannon entropy on payload with unusual ports
        elif event.payload_entropy > 7.1 and event.byte_count > 5000:
            score = 0.94
            classification = "EXPLOITATION"
            mitre = "T1190 - Exploit Public-Facing Application"

        # Lateral movement: SMB/WinRM from internal IP to internal IP
        elif event.port in (445, 139, 5985, 3389) and event.source_ip.startswith("10.0."):
            score = 0.76
            classification = "LATERAL_MOVEMENT"
            mitre = "T1021 - Remote Services"

        # Benign traffic baseline
        else:
            score = 0.05
            classification = "BENIGN"
            mitre = None

        confidence = 0.90 if classification != "BENIGN" else 0.95
        severity = self._score_to_severity(score)
        return classification, score, confidence, severity, mitre

    @staticmethod
    def _score_to_severity(score: float) -> str:
        if score >= 0.85:
            return "CRITICAL"
        if score >= 0.65:
            return "HIGH"
        if score >= 0.40:
            return "MEDIUM"
        return "LOW"

    def analyze(self, event: SecurityEventInput) -> DetectionResult:
        """Analyze a security event and produce an actionable detection verdict."""
        if self.model_loaded and self.model is not None:
            try:
                features = self._extract_feature_vector(event)
                pred_idx = int(self.model.predict(features)[0])
                classification = CLASSES[pred_idx] if 0 <= pred_idx < len(CLASSES) else "ANOMALY"

                probs = self.model.predict_proba(features)[0]
                confidence = float(np.max(probs))
                # Anomaly score is 1.0 - benign probability
                benign_prob = float(probs[0]) if len(probs) > 0 else 0.0
                anomaly_score = float(np.clip(1.0 - benign_prob, 0.0, 1.0))
                severity = self._score_to_severity(anomaly_score)

                mitre_map = {
                    "PORT_SCAN": "T1046 - Network Service Discovery",
                    "BRUTE_FORCE": "T1110 - Brute Force",
                    "EXPLOITATION": "T1190 - Exploit Public-Facing Application",
                    "LATERAL_MOVEMENT": "T1021 - Remote Services",
                }
                mitre = mitre_map.get(classification)

                action = "ALLOW" if classification == "BENIGN" else "QUARANTINE_SOURCE_OR_INSPECT"

                return DetectionResult(
                    classification=classification,
                    anomaly_score=round(anomaly_score, 4),
                    confidence=round(confidence, 4),
                    threat_severity=severity,
                    model_type="scikit-learn-random-forest",
                    model_loaded=True,
                    mitre_technique=mitre,
                    action_recommended=action,
                    details={
                        "source_ip": event.source_ip,
                        "destination_ip": event.destination_ip,
                        "port": event.port,
                        "protocol": event.protocol,
                        "payload_entropy": event.payload_entropy,
                        "prediction_probabilities": {CLASSES[i]: round(float(probs[i]), 4) for i in range(min(len(CLASSES), len(probs)))},
                    },
                )
            except Exception as e:
                logger.error(f"Inference error with model, falling back to heuristics: {e}")

        # Heuristic fallback path
        cls, score, conf, sev, mitre = self._heuristic_evaluate(event)
        action = "ALLOW" if cls == "BENIGN" else "INVESTIGATE_FLOW"

        return DetectionResult(
            classification=cls,
            anomaly_score=score,
            confidence=conf,
            threat_severity=sev,
            model_type="rule_based_heuristic_engine",
            model_loaded=False,
            mitre_technique=mitre,
            action_recommended=action,
            details={
                "source_ip": event.source_ip,
                "destination_ip": event.destination_ip,
                "port": event.port,
                "protocol": event.protocol,
                "payload_entropy": event.payload_entropy,
                "heuristic_rules_applied": ["port_scan_syn_check", "auth_volume_check", "entropy_threshold_check"],
            },
        )


# Global singleton instance
detector = ThreatDetector()
