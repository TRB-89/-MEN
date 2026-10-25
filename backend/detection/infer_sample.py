"""CLI Sample Inference Tool for Module 1 Threat Analysis Engine.

Runs sample benign and attack flows through the unified detection engine
(Random Forest, PyTorch MLP, Isolation Forest) and outputs formatted alerts.
"""

import sys
import os
import json
import argparse

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.threat_engine import threat_engine, NetworkFlowEvent


def run_sample_inference(sample_type: str = "exploit") -> int:
    print("=" * 70)
    print(f"ØMEN // MODULE 1: SAMPLE INFERENCE EVALUATION [{sample_type.upper()}]")
    print("=" * 70)

    if sample_type == "benign":
        # Realistic benign web browsing flow
        event = NetworkFlowEvent(
            event_id="EVT-BENIGN-001",
            device_id="ws-hr-02",
            proto="tcp",
            service="http",
            state="FIN",
            dur=0.15,
            spkts=10,
            dpkts=8,
            sbytes=750,
            dbytes=1450,
            rate=120.0,
            sttl=64,
            dttl=64,
            sload=40000.0,
            dload=75000.0,
            swin=255,
            dwin=255,
            ct_state_ttl=0,
            ct_dst_ltm=1,
            ct_src_dport_ltm=1,
            ct_dst_src_ltm=1,
        )
    else:
        # High-intensity exploitation flow with anomalous TTL, high packet volume, zero destination bytes
        event = NetworkFlowEvent(
            event_id="EVT-EXPLOIT-992",
            device_id="ws-dev-04",
            proto="tcp",
            service="-",
            state="INT",
            dur=0.000005,
            spkts=2,
            dpkts=0,
            sbytes=200,
            dbytes=0,
            rate=200000.0,
            sttl=254,
            dttl=0,
            sload=160000000.0,
            dload=0.0,
            swin=0,
            dwin=0,
            ct_state_ttl=2,
            ct_dst_ltm=12,
            ct_src_dport_ltm=10,
            ct_dst_src_ltm=10,
        )

    alert = threat_engine.analyze_event(event)
    print(json.dumps(alert.model_dump(), indent=2))
    print("=" * 70)
    print(f"VERDICT: {alert.threat_status} (Severity: {alert.severity})")
    print(f"RULE:    {alert.decision_rule}")
    print(f"SCORES:  RF Prob={alert.model_scores['rf_probability']}, MLP Prob={alert.model_scores['mlp_probability']}, Anomaly Index={alert.model_scores['anomaly_index']}")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run sample threat inference")
    parser.add_argument("--type", choices=["benign", "exploit"], default="exploit", help="Type of sample flow to evaluate")
    args = parser.parse_args()
    sys.exit(run_sample_inference(args.type))
