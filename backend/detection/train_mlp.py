"""PyTorch Multilayer Perceptron (MLP) Training Script.

Trains the neural network using BCEWithLogitsLoss, Adam optimizer, and
validation early-stopping on preprocessed UNSW-NB15 flow features.
Evaluates on the holdout test set and serializes weights and metrics.
"""

import sys
import os
import json
import argparse
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.preprocessor import DataPreprocessor, load_unsw_dataset
from backend.detection.mlp_network import ThreatDetectionMLP

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
WEIGHTS_PATH = os.path.join(MODELS_DIR, "mlp_weights.pt")
CONFIG_PATH = os.path.join(MODELS_DIR, "mlp_config.json")
METRICS_PATH = os.path.join(MODELS_DIR, "mlp_metrics.json")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def train_mlp(
    max_train_samples: int = 50000,
    epochs: int = 15,
    batch_size: int = 256,
    lr: float = 0.001,
    patience: int = 4,
    data_dir: str = None,
) -> int:
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print("=" * 70)
    print("ØMEN // MODULE 1: PYTORCH MLP NEURAL THREAT DETECTOR TRAINING")
    print(f"[*] Execution device: {device}")
    print("=" * 70)

    os.makedirs(MODELS_DIR, exist_ok=True)
    df_train, df_test, found = load_unsw_dataset(data_dir)
    if not found:
        print("[!] UNSW-NB15 dataset not found in backend/data. Aborting.")
        return 1

    if max_train_samples and max_train_samples < len(df_train):
        print(f"[*] Subsampling {max_train_samples:,} records for neural training...")
        df_train, _ = train_test_split(
            df_train,
            train_size=max_train_samples,
            stratify=df_train["label"],
            random_state=42,
        )
        df_train = df_train.reset_index(drop=True)

    y_train = df_train["label"].values.astype(np.float32)
    y_test = df_test["label"].values.astype(np.float32)

    # Load or fit preprocessor
    if os.path.exists(PREPROCESSOR_PATH):
        print(f"[*] Loading existing preprocessor from {PREPROCESSOR_PATH}...")
        preprocessor = DataPreprocessor.load(PREPROCESSOR_PATH)
        X_train = preprocessor.transform(df_train)
    else:
        print("[*] Fitting preprocessing pipeline on training data...")
        preprocessor = DataPreprocessor()
        X_train = preprocessor.fit_transform(df_train)
        preprocessor.save(PREPROCESSOR_PATH)

    X_test = preprocessor.transform(df_test)

    # Split train into train and validation for early stopping
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train, test_size=0.15, stratify=y_train, random_state=42
    )

    train_loader = DataLoader(
        TensorDataset(torch.from_numpy(X_tr).float(), torch.from_numpy(y_tr).float()),
        batch_size=batch_size,
        shuffle=True,
    )
    val_loader = DataLoader(
        TensorDataset(torch.from_numpy(X_val).float(), torch.from_numpy(y_val).float()),
        batch_size=batch_size,
        shuffle=False,
    )

    input_dim = X_train.shape[1]
    model = ThreatDetectionMLP(input_dim=input_dim, hidden_dim1=128, hidden_dim2=64, dropout1=0.3, dropout2=0.2)
    model.to(device)

    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    best_val_loss = float("inf")
    best_weights = None
    epochs_no_improve = 0
    history = []

    print(f"[*] Architecture: Input({input_dim}) -> Linear(128) -> ReLU -> Dropout(0.3) -> Linear(64) -> ReLU -> Dropout(0.2) -> Linear(1)")
    print(f"[*] Beginning training ({epochs} max epochs, batch_size={batch_size}, lr={lr})...")

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(batch_y)

        train_loss /= len(X_tr)

        # Validation
        model.eval()
        val_loss = 0.0
        val_preds, val_targets = [], []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                logits = model(batch_x)
                loss = criterion(logits, batch_y)
                val_loss += loss.item() * len(batch_y)
                probs = torch.sigmoid(logits)
                val_preds.extend(probs.cpu().numpy())
                val_targets.extend(batch_y.cpu().numpy())

        val_loss /= len(X_val)
        val_f1 = f1_score(val_targets, (np.array(val_preds) >= 0.5).astype(int), zero_division=0)
        history.append({"epoch": epoch, "train_loss": round(train_loss, 4), "val_loss": round(val_loss, 4), "val_f1": round(val_f1, 4)})

        print(f"  Epoch {epoch:2d}/{epochs:2d} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val F1: {val_f1:.4f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= patience:
                print(f"[*] Early stopping triggered at epoch {epoch} (patience={patience}).")
                break

    # Restore best weights
    if best_weights is not None:
        model.load_state_dict(best_weights)
        model.to(device)

    # Final Evaluation on holdout test set (82,332 records)
    print("\n[*] Evaluating best PyTorch model on holdout testing set (82,332 records)...")
    test_probs = model.predict_proba(X_test, device=device)
    test_preds = (test_probs >= 0.5).astype(int)

    acc = float(accuracy_score(y_test, test_preds))
    prec = float(precision_score(y_test, test_preds, zero_division=0))
    rec = float(recall_score(y_test, test_preds, zero_division=0))
    f1 = float(f1_score(y_test, test_preds, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, test_probs))
    cm = confusion_matrix(y_test, test_preds).tolist()

    # Save artifacts
    model.save(WEIGHTS_PATH, CONFIG_PATH)
    metrics = {
        "model_type": "ThreatDetectionMLP",
        "framework": "PyTorch",
        "device": str(device),
        "input_dim": input_dim,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "epochs_trained": len(history),
        "best_val_loss": round(best_val_loss, 4),
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
        "history": history,
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "=" * 70)
    print("PYTORCH MLP EVALUATION RESULTS:")
    print(f"  - Accuracy:  {acc * 100:.2f}%")
    print(f"  - Precision: {prec * 100:.2f}%")
    print(f"  - Recall:    {rec * 100:.2f}%")
    print(f"  - F1-Score:  {f1 * 100:.2f}%")
    print(f"  - ROC-AUC:   {roc_auc:.4f}")
    print(f"  - Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]}")
    print("=" * 70)
    print(f"[+] Model weights saved to: {WEIGHTS_PATH}")
    print(f"[+] Architecture config:    {CONFIG_PATH}")
    print(f"[+] Metrics saved to:        {METRICS_PATH}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PyTorch MLP neural threat detector")
    parser.add_argument("--samples", type=int, default=50000, help="Max training samples")
    parser.add_argument("--epochs", type=int, default=15, help="Epochs")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--patience", type=int, default=4, help="Early stopping patience")
    parser.add_argument("--data-dir", default=None, help="UNSW-NB15 dataset directory")
    args = parser.parse_args()
    sys.exit(train_mlp(args.samples, args.epochs, args.batch_size, args.lr, args.patience, args.data_dir))
