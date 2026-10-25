"""Comprehensive Evaluation CLI for all Module 1 Detection Models.

Evaluates Random Forest, PyTorch MLP, and Isolation Forest against the
UNSW-NB15 holdout test set and exports unified performance metrics.
"""

import sys
import os
import json
import argparse
import numpy as np
import pandas as pd
import joblib
import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.preprocessor import DataPreprocessor, load_unsw_dataset
from backend.detection.mlp_network import ThreatDetectionMLP
from backend.detection.fit_isolation_forest import compute_normalized_anomaly_score

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
RF_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
MLP_WEIGHTS_PATH = os.path.join(MODELS_DIR, "mlp_weights.pt")
MLP_CONFIG_PATH = os.path.join(MODELS_DIR, "mlp_config.json")
ISO_PATH = os.path.join(MODELS_DIR, "isolation_forest_model.joblib")
ALL_METRICS_PATH = os.path.join(MODELS_DIR, "all_metrics.json")


def evaluate_all_models(data_dir: str = None, max_test_samples: int = None) -> int:
    print("=" * 70)
    print("ØMEN // MODULE 1: COMPREHENSIVE MULTI-MODEL BENCHMARK")
    print("=" * 70)

    if not os.path.exists(PREPROCESSOR_PATH):
        print("[!] Preprocessor missing. Please train models first.")
        return 1

    preprocessor = DataPreprocessor.load(PREPROCESSOR_PATH)
    _, df_test, found = load_unsw_dataset(data_dir)
    if not found:
        print("[!] UNSW-NB15 dataset not found in backend/data. Aborting.")
        return 1

    if max_test_samples and max_test_samples < len(df_test):
        print(f"[*] Subsampling {max_test_samples:,} test records for fast evaluation...")
        df_test = df_test.sample(max_test_samples, random_state=42).reset_index(drop=True)

    y_test = df_test["label"].values.astype(int)
    print(f"[*] Preprocessing {len(df_test):,} test flows...")
    X_test = preprocessor.transform(df_test)

    results = {
        "evaluation_dataset": "UNSW-NB15",
        "test_samples": len(df_test),
        "models": {},
    }

    # 1. Random Forest
    if os.path.exists(RF_PATH):
        print("[*] Evaluating Random Forest Classifier...")
        rf_model = joblib.load(RF_PATH)
        rf_pred = rf_model.predict(X_test)
        rf_prob = rf_model.predict_proba(X_test)[:, 1]
        cm_rf = confusion_matrix(y_test, rf_pred).tolist()
        results["models"]["random_forest"] = {
            "status": "trained",
            "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
            "precision": round(float(precision_score(y_test, rf_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, rf_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, rf_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, rf_prob)), 4),
            "confusion_matrix": {"tn": cm_rf[0][0], "fp": cm_rf[0][1], "fn": cm_rf[1][0], "tp": cm_rf[1][1]},
        }
    else:
        results["models"]["random_forest"] = {"status": "not_trained"}

    # 2. PyTorch MLP
    if os.path.exists(MLP_WEIGHTS_PATH) and os.path.exists(MLP_CONFIG_PATH):
        print("[*] Evaluating PyTorch MLP Neural Network...")
        mlp_model = ThreatDetectionMLP.load_from_artifacts(MLP_WEIGHTS_PATH, MLP_CONFIG_PATH)
        mlp_prob = mlp_model.predict_proba(X_test)
        mlp_pred = (mlp_prob >= 0.5).astype(int)
        cm_mlp = confusion_matrix(y_test, mlp_pred).tolist()
        results["models"]["mlp_neural_network"] = {
            "status": "trained",
            "accuracy": round(float(accuracy_score(y_test, mlp_pred)), 4),
            "precision": round(float(precision_score(y_test, mlp_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, mlp_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, mlp_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, mlp_prob)), 4),
            "confusion_matrix": {"tn": cm_mlp[0][0], "fp": cm_mlp[0][1], "fn": cm_mlp[1][0], "tp": cm_mlp[1][1]},
        }
    else:
        results["models"]["mlp_neural_network"] = {"status": "not_trained"}

    # 3. Isolation Forest
    if os.path.exists(ISO_PATH):
        print("[*] Evaluating Isolation Forest Anomaly Detector...")
        iso_payload = joblib.load(ISO_PATH)
        iso_model = iso_payload["model"] if isinstance(iso_payload, dict) else iso_payload
        iso_thresh = iso_payload.get("threshold", 0.5) if isinstance(iso_payload, dict) else 0.5
        iso_scores = compute_normalized_anomaly_score(iso_model, X_test)
        iso_pred = (iso_scores >= iso_thresh).astype(int)
        cm_iso = confusion_matrix(y_test, iso_pred).tolist()
        tn, fp, fn, tp = cm_iso[0][0], cm_iso[0][1], cm_iso[1][0], cm_iso[1][1]
        results["models"]["isolation_forest"] = {
            "status": "trained",
            "calibrated_threshold": round(float(iso_thresh), 4),
            "precision": round(float(precision_score(y_test, iso_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, iso_pred, zero_division=0)), 4),
            "false_positive_rate": round(float(fp / max(1, fp + tn)), 4),
            "f1_score": round(float(f1_score(y_test, iso_pred, zero_division=0)), 4),
            "confusion_matrix": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
        }
    else:
        results["models"]["isolation_forest"] = {"status": "not_trained"}

    with open(ALL_METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 70)
    print(f"{'MODEL':<24} | {'STATUS':<10} | {'ACCURACY':<8} | {'PRECISION':<9} | {'RECALL':<8} | {'F1-SCORE':<8}")
    print("-" * 70)
    for name, m in results["models"].items():
        if m.get("status") == "trained":
            acc_str = f"{m.get('accuracy', 0)*100:.1f}%" if "accuracy" in m else "N/A"
            prec_str = f"{m.get('precision', 0)*100:.1f}%"
            rec_str = f"{m.get('recall', 0)*100:.1f}%"
            f1_str = f"{m.get('f1_score', 0)*100:.1f}%"
            print(f"{name:<24} | {'ONLINE':<10} | {acc_str:<8} | {prec_str:<9} | {rec_str:<8} | {f1_str:<8}")
        else:
            print(f"{name:<24} | {'UNAVAILABLE':<10} | {'-':<8} | {'-':<9} | {'-':<8} | {'-':<8}")
    print("=" * 70)
    print(f"[+] Multi-model benchmark saved to: {ALL_METRICS_PATH}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate all Module 1 models")
    parser.add_argument("--samples", type=int, default=None, help="Max test samples to evaluate")
    parser.add_argument("--data-dir", default=None, help="UNSW-NB15 dataset directory")
    args = parser.parse_args()
    sys.exit(evaluate_all_models(args.data_dir, args.samples))
