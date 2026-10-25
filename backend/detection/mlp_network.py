from __future__ import annotations

import json
import os
from typing import Dict, Any, Optional
import numpy as np

try:
    import torch
    import torch.nn as nn
    _ModuleBase = nn.Module
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    nn = None
    _ModuleBase = object
    TORCH_AVAILABLE = False


class ThreatDetectionMLP(_ModuleBase):
    """Deep fully-connected neural classifier for binary intrusion detection."""

    def __init__(self, input_dim: int, hidden_dim1: int = 128, hidden_dim2: int = 64, dropout1: float = 0.3, dropout2: float = 0.2):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim1 = hidden_dim1
        self.hidden_dim2 = hidden_dim2
        self.dropout1 = dropout1
        self.dropout2 = dropout2

        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim1),
            nn.ReLU(),
            nn.Dropout(p=dropout1),
            nn.Linear(hidden_dim1, hidden_dim2),
            nn.ReLU(),
            nn.Dropout(p=dropout2),
            nn.Linear(hidden_dim2, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning unscaled raw logits."""
        return self.net(x).squeeze(-1)

    def predict_proba(self, x: np.ndarray, device: Optional[torch.device] = None) -> np.ndarray:
        """Run evaluation inference and return sigmoid probabilities."""
        self.eval()
        if device is None:
            device = next(self.parameters()).device

        with torch.no_grad():
            tensor_x = torch.from_numpy(x).float().to(device)
            logits = self.forward(tensor_x)
            probs = torch.sigmoid(logits).cpu().numpy()
        return probs

    def save(self, weights_path: str, config_path: str) -> None:
        """Save model weights and architecture configuration."""
        os.makedirs(os.path.dirname(os.path.abspath(weights_path)), exist_ok=True)
        torch.save(self.state_dict(), weights_path)
        config = {
            "model_type": "ThreatDetectionMLP",
            "framework": "PyTorch",
            "input_dim": self.input_dim,
            "hidden_dim1": self.hidden_dim1,
            "hidden_dim2": self.hidden_dim2,
            "dropout1": self.dropout1,
            "dropout2": self.dropout2,
            "activation": "ReLU",
            "loss_function": "BCEWithLogitsLoss",
        }
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    @classmethod
    def load_from_artifacts(cls, weights_path: str, config_path: str, device: Optional[torch.device] = None) -> "ThreatDetectionMLP":
        """Instantiate and load trained model from weights and config."""
        if not os.path.exists(config_path) or not os.path.exists(weights_path):
            raise FileNotFoundError(f"MLP artifacts missing: {weights_path} or {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        if device is None:
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        model = cls(
            input_dim=config["input_dim"],
            hidden_dim1=config.get("hidden_dim1", 128),
            hidden_dim2=config.get("hidden_dim2", 64),
            dropout1=config.get("dropout1", 0.3),
            dropout2=config.get("dropout2", 0.2),
        )
        state_dict = torch.load(weights_path, map_location=device, weights_only=True)
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        return model
