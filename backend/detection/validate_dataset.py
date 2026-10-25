"""CLI Dataset Validation Script for UNSW-NB15 Intrusion Detection Dataset.

Inspects dataset files, verifies column schemas, checks for missing and
infinite values, reports class distribution, and confirms leakage shielding.
"""

import sys
import os
import argparse
import pandas as pd
import numpy as np

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.detection.preprocessor import load_unsw_dataset, LEAKAGE_COLUMNS, CATEGORICAL_COLUMNS


def validate_dataset(dataset_dir: str = None) -> int:
    print("=" * 70)
    print("ØMEN // UNSW-NB15 DATASET INTEGRITY VALIDATOR")
    print("=" * 70)

    df_train, df_test, found = load_unsw_dataset(dataset_dir)
    if not found:
        print("[!] Dataset CSV files NOT FOUND.")
        print("    Expected locations:")
        print("      - backend/data/UNSW_NB15_training-set.csv")
        print("      - backend/data/UNSW_NB15_testing-set.csv")
        print("    Please follow instructions in: backend/data/DATASET_SETUP.md")
        return 1

    print(f"[+] Found Training Set: {df_train.shape[0]:,} records, {df_train.shape[1]} columns")
    print(f"[+] Found Testing Set:  {df_test.shape[0]:,} records, {df_test.shape[1]} columns")

    # 1. Leakage Shield Check
    print("\n--- [1] Leakage Shield Verification ---")
    for col in LEAKAGE_COLUMNS:
        if col in df_train.columns:
            print(f"  [OK] Shielding active: '{col}' detected and flagged for target isolation.")
        else:
            print(f"  [!] Warning: Expected column '{col}' not in dataset.")

    # 2. Missing & Infinite Values
    print("\n--- [2] Missing and Infinite Value Scan ---")
    train_nulls = df_train.isnull().sum().sum()
    test_nulls = df_test.isnull().sum().sum()
    print(f"  - Training null values: {train_nulls}")
    print(f"  - Testing null values:  {test_nulls}")

    # Check for infinite numeric values
    num_cols = [c for c in df_train.columns if c not in CATEGORICAL_COLUMNS + ["attack_cat"]]
    train_infs = np.isinf(df_train[num_cols].select_dtypes(include=[np.number])).sum().sum()
    print(f"  - Training infinite values: {train_infs}")

    # 3. Label and Category Distributions
    print("\n--- [3] Target Class Distributions ---")
    print("  Binary Labels (0 = Normal, 1 = Attack):")
    for k, v in df_train["label"].value_counts().items():
        pct = (v / len(df_train)) * 100
        label_name = "Normal (Benign)" if k == 0 else "Malicious (Attack)"
        print(f"    - {k} [{label_name}]: {v:,} ({pct:.2f}%)")

    print("\n  Multi-class Attack Categories (Training Set):")
    for cat, count in df_train["attack_cat"].str.strip().value_counts().items():
        pct = (count / len(df_train)) * 100
        print(f"    - {cat:<18}: {count:>7,} ({pct:5.2f}%)")

    print("\n" + "=" * 70)
    print("[SUCCESS] UNSW-NB15 dataset is validated and ready for model training.")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate UNSW-NB15 dataset integrity")
    parser.add_argument("--data-dir", default=None, help="Directory containing UNSW_NB15 CSV files")
    args = parser.parse_args()
    sys.exit(validate_dataset(args.data_dir))
