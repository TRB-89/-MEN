"""Data Preprocessing Pipeline for the UNSW-NB15 Intrusion Detection Dataset.

Ensures strict separation of features from target labels, shields against
leakage-prone identifiers (e.g. 'id'), handles categorical encoding and
numeric scaling fit strictly on the training partition, and provides a
reusable transformation interface during inference.
"""

import os
import json
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib

logger = logging.getLogger("omen.preprocessor")

LEAKAGE_COLUMNS = ["id", "label", "attack_cat"]
CATEGORICAL_COLUMNS = ["proto", "service", "state"]


class DataPreprocessor:
    """Production-grade tabular preprocessor for network flow telemetry."""

    def __init__(self):
        self.numeric_columns: List[str] = []
        self.categorical_columns: List[str] = CATEGORICAL_COLUMNS
        self.numeric_medians: Dict[str, float] = {}
        self.scaler = StandardScaler()
        self.encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.feature_names_out: List[str] = []
        self.is_fitted: bool = False
        self.sample_default_record: Dict[str, Any] = {}

    def fit(self, df: pd.DataFrame) -> "DataPreprocessor":
        """Fit preprocessor strictly on training data."""
        # Strip leakage columns if present
        clean_df = df.drop(columns=[col for col in LEAKAGE_COLUMNS if col in df.columns], errors="ignore")

        # Determine numerical columns
        self.numeric_columns = [
            c for c in clean_df.columns if c not in self.categorical_columns
        ]

        # Compute medians for numeric imputation
        for col in self.numeric_columns:
            series = pd.to_numeric(clean_df[col], errors="coerce").replace([np.inf, -np.inf], np.nan)
            med = float(series.median())
            if np.isnan(med):
                med = 0.0
            self.numeric_medians[col] = med

        # Impute numeric features
        num_data = self._impute_numeric(clean_df[self.numeric_columns])
        self.scaler.fit(num_data)

        # Impute and fit categoricals
        cat_data = self._clean_categoricals(clean_df[self.categorical_columns])
        self.encoder.fit(cat_data)

        # Build output feature names
        num_names = [f"num__{c}" for c in self.numeric_columns]
        cat_names = [f"cat__{c}" for c in self.encoder.get_feature_names_out(self.categorical_columns)]
        self.feature_names_out = num_names + cat_names

        # Compute sample baseline record from median and top categories for default inference
        self.sample_default_record = dict(self.numeric_medians)
        self.sample_default_record["proto"] = "tcp"
        self.sample_default_record["service"] = "-"
        self.sample_default_record["state"] = "FIN"

        self.is_fitted = True
        logger.info(
            f"Fitted DataPreprocessor: {len(self.numeric_columns)} numeric features, "
            f"{len(self.categorical_columns)} categorical features -> "
            f"{len(self.feature_names_out)} encoded output dimensions."
        )
        return self

    def transform(self, df: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]) -> np.ndarray:
        """Transform incoming data using the fitted preprocessing pipeline."""
        if not self.is_fitted:
            raise RuntimeError("DataPreprocessor must be fitted before calling transform().")

        if isinstance(df, dict):
            df = pd.DataFrame([df])
        elif isinstance(df, list):
            df = pd.DataFrame(df)

        clean_df = df.drop(columns=[col for col in LEAKAGE_COLUMNS if col in df.columns], errors="ignore").copy()

        # Fill any missing expected numeric columns with median
        for col in self.numeric_columns:
            if col not in clean_df.columns:
                clean_df[col] = self.numeric_medians.get(col, 0.0)

        # Fill missing categoricals
        for col in self.categorical_columns:
            if col not in clean_df.columns:
                clean_df[col] = "-"

        # Impute and scale numeric features
        num_data = self._impute_numeric(clean_df[self.numeric_columns])
        num_scaled = self.scaler.transform(num_data)
        # Clip extreme outliers to keep neural networks numerically stable
        num_scaled = np.clip(num_scaled, -10.0, 10.0)

        # Clean and encode categorical features
        cat_data = self._clean_categoricals(clean_df[self.categorical_columns])
        cat_encoded = self.encoder.transform(cat_data)

        return np.hstack([num_scaled, cat_encoded]).astype(np.float32)

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Fit on DataFrame and return transformed matrix."""
        return self.fit(df).transform(df)

    def _impute_numeric(self, df_num: pd.DataFrame) -> pd.DataFrame:
        clean = pd.DataFrame(index=df_num.index)
        for col in self.numeric_columns:
            val = pd.to_numeric(df_num[col], errors="coerce").replace([np.inf, -np.inf], np.nan)
            clean[col] = val.fillna(self.numeric_medians.get(col, 0.0))
        return clean

    def _clean_categoricals(self, df_cat: pd.DataFrame) -> pd.DataFrame:
        clean = pd.DataFrame(index=df_cat.index)
        for col in self.categorical_columns:
            clean[col] = df_cat[col].fillna("-").astype(str).str.strip().str.lower()
        return clean

    def save(self, filepath: str) -> None:
        """Serialize preprocessor to disk."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        joblib.dump(self, filepath)
        schema_path = os.path.join(os.path.dirname(filepath), "feature_schema.json")
        self.export_schema(schema_path)
        logger.info(f"Preprocessor saved to {filepath} and schema to {schema_path}")

    @classmethod
    def load(cls, filepath: str) -> "DataPreprocessor":
        """Load fitted preprocessor from disk."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Preprocessor artifact not found at {filepath}")
        return joblib.load(filepath)

    def export_schema(self, filepath: str) -> None:
        """Export feature metadata and default schema as JSON."""
        schema = {
            "version": "1.0.0",
            "dataset": "UNSW-NB15",
            "leakage_columns_shielded": LEAKAGE_COLUMNS,
            "raw_numeric_features": self.numeric_columns,
            "raw_categorical_features": self.categorical_columns,
            "numeric_medians": self.numeric_medians,
            "total_raw_features": len(self.numeric_columns) + len(self.categorical_columns),
            "total_transformed_features": len(self.feature_names_out),
            "sample_default_record": self.sample_default_record,
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)


def load_unsw_dataset(
    dataset_dir: Optional[str] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, bool]:
    """Load train and test partitions from dataset directory.

    Returns:
        (df_train, df_test, dataset_found)
    """
    if not dataset_dir:
        dataset_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

    train_path = os.path.join(dataset_dir, "UNSW_NB15_training-set.csv")
    test_path = os.path.join(dataset_dir, "UNSW_NB15_testing-set.csv")

    if not (os.path.exists(train_path) and os.path.exists(test_path)):
        return pd.DataFrame(), pd.DataFrame(), False

    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)
    return df_train, df_test, True
