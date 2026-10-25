"""Random Forest Model Training and Evaluation for UNSW-NB15 Intrusion Detection.

Trains a Scikit-learn RandomForestClassifier on preprocessed network flow data,
evaluates on the testing partition, computes precision, recall, F1, ROC-AUC,
confusion matrix, and extracts top feature importances.
"""

import sys
import os
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
import joblib

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.preprocessor import DataPreprocessor, load_unsw_dataset, LEAKAGE_COLUMNS

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
METRICS_PATH = os.path.join(MODELS_DIR, "rf_metrics.json")


def train_random_forest(
    max_train_samples: int = 60000,
    n_estimators: int = 100,
    max_depth: int = 16,
    data_dir: str = None,
) -> int:
    print("=" * 70)
    print("ØMEN // MODULE 1: RANDOM FOREST CLASSIFIER TRAINING")
    print("=" * 70)

    os.makedirs(MODELS_DIR, exist_ok=True)
    df_train, df_test, found = load_unsw_dataset(data_dir)
    if not found:
        print("[!] UNSW-NB15 dataset not found in backend/data. Aborting.")
        return 1

    # Class-aware stratified subsampling for rapid, high-assurance training
    if max_train_samples and max_train_samples < len(df_train):
        print(f"[*] Subsampling {max_train_samples:,} records for high-throughput training...")
        from sklearn.model_selection import train_test_split
        df_train, _ = train_test_split(
            df_train,
            train_size=max_train_samples,
            stratify=df_train["label"],
            random_state=42,
        )
        df_train = df_train.reset_index(drop=True)

    y_train = df_train["label"].values.astype(int)
    y_test = df_test["label"].values.astype(int)

    # Preprocessing
    print("[*] Fitting preprocessing pipeline on training data only...")
    preprocessor = DataPreprocessor()
    X_train = preprocessor.fit_transform(df_train)
    X_test = preprocessor.transform(df_test)

    # Save fitted preprocessor
    preprocessor.save(PREPROCESSOR_PATH)
    print(f"[+] Saved preprocessing pipeline to {PREPROCESSOR_PATH}")
    print(f"    Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    # Model definition
    print(f"[*] Training RandomForestClassifier (n_estimators={n_estimators}, max_depth={max_depth})...")
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )
    clf.fit(X_train, y_train)

    # Evaluation on holdout test set
    print("[*] Evaluating on UNSW-NB15 holdout testing set (82,332 records)...")
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    importances = clf.feature_importances_
    feature_names = preprocessor.feature_names_out
    indices = np.argsort(importances)[::-1]
    top_features = [
        {"feature": feature_names[idx], "importance": round(float(importances[idx]), 4)}
        for idx in indices[:15]
    ]

    metrics = {
        "model_type": "RandomForestClassifier",
        "library": "scikit-learn",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "hyperparameters": {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "class_weight": "balanced",
            "random_state": 42,
        },
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": {
            "tn": cm[0][0],
            "fp": cm[0][1],
            "fn": cm[1][0],
            "tp": cm[1][1],
        },
        "top_features": top_features,
        "classes": ["Normal", "Malicious"],
    }

    # Save model and metrics
    joblib.dump(clf, MODEL_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "=" * 70)
    print("RANDOM FOREST EVALUATION RESULTS:")
    print(f"  - Accuracy:  {acc * 100:.2f}%")
    print(f"  - Precision: {prec * 100:.2f}%")
    print(f"  - Recall:    {rec * 100:.2f}%")
    print(f"  - F1-Score:  {f1 * 100:.2f}%")
    print(f"  - ROC-AUC:   {roc_auc:.4f}")
    print(f"  - Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print("\nTop 5 Predictive Features:")
    for feat in top_features[:5]:
        print(f"    * {feat['feature']:<30}: {feat['importance']:.4f}")
    print("=" * 70)
    print(f"[+] Model artifact serialized to: {MODEL_PATH}")
    print(f"[+] Evaluation metrics saved to:  {METRICS_PATH}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Random Forest threat detector")
    parser.add_argument("--samples", type=int, default=60000, help="Max training samples")
    parser.add_argument("--trees", type=int, default=100, help="Number of trees")
    parser.add_argument("--max-depth", type=int, default=16, help="Maximum tree depth")
    parser.add_argument("--data-dir", default=None, help="UNSW-NB15 dataset directory")
    args = parser.parse_args()
    sys.exit(train_random_forest(args.samples, args.trees, args.max_depth, args.data_dir))
