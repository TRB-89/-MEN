from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.path_prediction.path_analyzer import find_attack_paths
from backend.graph_engine.topology import DEVICE_DATA

router = APIRouter(prefix="/prediction", tags=["Attack Path Prediction"])


class AttackPathRequest(BaseModel):
    source_node: str = Field(default="srv-web-01", description="Breach entry foothold node")
    target_node: Optional[str] = Field(default=None, description="Crown jewel destination (optional)")
    isolated_nodes: Optional[List[str]] = Field(default=[], description="Currently isolated network nodes")
    max_hops: int = Field(default=5, ge=1, le=8, description="Maximum traversal search depth")


@router.post("/attack-paths")
def predict_attack_paths(request: AttackPathRequest):
    """Predict and rank all simple attack paths from entry point to high-value assets."""
    results = find_attack_paths(
        source_node=request.source_node,
        target_node=request.target_node,
        isolated_nodes=request.isolated_nodes,
        max_hops=request.max_hops,
    )
    if "error" in results:
        raise HTTPException(status_code=400, detail=results["error"])
    return results


@router.get("/high-risk-targets")
def get_high_risk_targets():
    """Identify enterprise assets designated as CRITICAL or HIGH risk."""
    high_value = [
        d for d in DEVICE_DATA
        if d.get("criticality") in ("CRITICAL", "HIGH")
    ]
    return {
        "count": len(high_value),
        "targets": high_value,
    }
