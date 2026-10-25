"""Isolation Forest Unsupervised Anomaly Detection for Baseline Deviation Scoring.

Fits an IsolationForest estimator strictly on normal/benign network flows,
calibrates an anomaly decision threshold on validation data, and evaluates
precision, recall, and false-positive rate on holdout test flows.
NOTE: Anomaly detection serves as supporting evidence, not standalone proof.
"""

import sys
import os
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
import joblib

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.preprocessor import DataPreprocessor, load_unsw_dataset

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "isolation_forest_model.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "isolation_forest_metrics.json")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")


def compute_normalized_anomaly_score(model: IsolationForest, X: np.ndarray) -> np.ndarray:
    """Compute normalized anomaly score in [0.0, 1.0].

    In scikit-learn IsolationForest:
      - score_samples(X) returns negative values, where lower (more negative) = more anomalous.
      - decision_function(X) > 0 for inliers, < 0 for outliers.
    We convert to normalized anomaly index: 0.0 = deeply normal, 1.0 = extreme outlier anomaly.
    """
    raw_dec = model.decision_function(X)
    # Sigmoidal mapping centered at 0.0
    norm_score = 1.0 / (1.0 + np.exp(raw_dec * 4.0))
    return np.clip(norm_score, 0.0, 1.0)


def fit_isolation_forest(
    normal_samples: int = 35000,
    contamination: float = 0.05,
    n_estimators: int = 100,
    data_dir: str = None,
) -> int:
    print("=" * 70)
    print("ØMEN // MODULE 1: ISOLATION FOREST ANOMALY DETECTOR FITTING")
    print("=" * 70)

    os.makedirs(MODELS_DIR, exist_ok=True)
    df_train, df_test, found = load_unsw_dataset(data_dir)
    if not found:
        print("[!] UNSW-NB15 dataset not found in backend/data. Aborting.")
        return 1

    # Filter strictly normal records for baseline profile fitting
    df_normal = df_train[df_train["label"] == 0].copy()
    if normal_samples and normal_samples < len(df_normal):
        df_normal = df_normal.sample(normal_samples, random_state=42).reset_index(drop=True)

    print(f"[*] Fitting baseline profile on {len(df_normal):,} verified normal flows...")

    if not os.path.exists(PREPROCESSOR_PATH):
        print("[*] Fitting preprocessing pipeline...")
        preprocessor = DataPreprocessor()
        X_train_norm = preprocessor.fit_transform(df_normal)
        preprocessor.save(PREPROCESSOR_PATH)
    else:
        preprocessor = DataPreprocessor.load(PREPROCESSOR_PATH)
        X_train_norm = preprocessor.transform(df_normal)

    # Fit Isolation Forest
    print(f"[*] Training IsolationForest (n_estimators={n_estimators}, contamination={contamination})...")
    iso = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )
    iso.fit(X_train_norm)

    # Calibrate decision threshold using normal validation distribution
    norm_scores = compute_normalized_anomaly_score(iso, X_train_norm)
    calibrated_threshold = float(np.percentile(norm_scores, 95))
    print(f"[+] Calibrated 95th-percentile anomaly threshold on normal baseline: {calibrated_threshold:.4f}")

    # Evaluate against labeled test set (82,332 records)
    print("[*] Evaluating anomaly detection on holdout testing set (82,332 records)...")
    X_test = preprocessor.transform(df_test)
    y_test = df_test["label"].values.astype(int)

    test_anomaly_scores = compute_normalized_anomaly_score(iso, X_test)
    y_pred_anomaly = (test_anomaly_scores >= calibrated_threshold).astype(int)

    cm = confusion_matrix(y_test, y_pred_anomaly)
    tn, fp, fn, tp = cm.ravel()

    prec = float(precision_score(y_test, y_pred_anomaly, zero_division=0))
    rec = float(recall_score(y_test, y_pred_anomaly, zero_division=0))
    f1 = float(f1_score(y_test, y_pred_anomaly, zero_division=0))
    fpr = float(fp / max(1, (fp + tn)))

    metrics = {
        "model_type": "IsolationForest",
        "library": "scikit-learn",
        "training_normal_samples": len(df_normal),
        "test_samples": len(X_test),
        "contamination": contamination,
        "calibrated_threshold": round(calibrated_threshold, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(fpr, 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
        "role": "supporting_anomaly_evidence",
        "note": "Anomaly score measures distance from normal baseline. Does not constitute proof of attack.",
    }

    joblib.dump({"model": iso, "threshold": calibrated_threshold}, MODEL_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "=" * 70)
    print("ISOLATION FOREST EVALUATION RESULTS (AS ANOMALY EVIDENCE):")
    print(f"  - Calibrated Alert Threshold: {calibrated_threshold:.4f}")
    print(f"  - Anomaly Recall:             {rec * 100:.2f}% (Attack Outlier Flag)")
    print(f"  - Anomaly Precision:          {prec * 100:.2f}%")
    print(f"  - False Positive Rate:        {fpr * 100:.2f}%")
    print(f"  - F1-Score:                   {f1 * 100:.2f}%")
    print(f"  - Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print("=" * 70)
    print(f"[+] Model artifact serialized to: {MODEL_PATH}")
    print(f"[+] Metrics saved to:              {METRICS_PATH}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fit Isolation Forest anomaly detector")
    parser.add_argument("--samples", type=int, default=35000, help="Normal training samples")
    parser.add_argument("--trees", type=int, default=100, help="Number of trees")
    parser.add_argument("--contamination", type=float, default=0.05, help="Contamination rate")
    parser.add_argument("--data-dir", default=None, help="UNSW-NB15 dataset directory")
    args = parser.parse_args()
    sys.exit(fit_isolation_forest(args.samples, args.contamination, args.trees, args.data_dir))
