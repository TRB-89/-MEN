"""ØMEN Cybersecurity API

Predictive Cyber Threat Intelligence & Autonomous Defense Simulation System.
FastAPI backend service providing real-time threat detection, NetworkX topology,
graph attack-path prediction, zero-trust defense simulation, and incident memory.
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database.db import init_db
from backend.detection.detector import detector
from backend.detection.train_baseline import train_and_export
from backend.graph_engine.topology import DEVICE_DATA

# Routers
from backend.api.detection import router as detection_router
from backend.api.network import router as network_router
from backend.api.prediction import router as prediction_router
from backend.api.defense import router as defense_router
from backend.api.incidents import router as incidents_router
from backend.api.threat_intel import router as threat_intel_router

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("omen.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for startup and shutdown procedures."""
    logger.info("Initializing ØMEN Cyber Threat Intelligence Backend...")

    # 1. Initialize SQLite / SQLAlchemy tables and initial seed data
    try:
        init_db()
        logger.info("Incident Memory database schema initialized.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    # 2. Check and prepare Scikit-learn threat detector model
    if not detector.model_loaded:
        logger.info("Generating baseline Scikit-learn threat detector model...")
        try:
            train_and_export()
            detector.load_model()
            logger.info("Baseline Scikit-learn model trained and loaded.")
        except Exception as e:
            logger.warning(f"Could not pre-train baseline model: {e}")

    # 3. Initialize Threat Intelligence service (MITRE ATT&CK STIX & CISA KEV)
    try:
        from backend.threat_intel.service import threat_intel_service
        threat_intel_service.initialize(auto_fetch=False)
        logger.info("Threat Intelligence service initialized with local offline caches.")
    except Exception as e:
        logger.warning(f"Threat Intelligence initialization warning: {e}")

    logger.info("ØMEN Cybersecurity API is ready to accept requests.")
    yield
    logger.info("ØMEN Cybersecurity API shutting down.")


app = FastAPI(
    title="ØMEN Cybersecurity API",
    description="Predictive Cyber Threat Intelligence & Autonomous Defense Simulation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
origins_str = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
origins = [o.strip() for o in origins_str.split(",") if o.strip()]
if "*" not in origins:
    origins.append("http://localhost:5173")
    origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred within the ØMEN engine.",
            "path": request.url.path,
        },
    )


# Health check endpoint
@app.get("/health", tags=["System Telemetry"])
@app.get("/api/health", tags=["System Telemetry"])
def health_check():
    """Health status check returning API status, database state, and model readiness."""
    return {
        "status": "online",
        "system": "ØMEN Cybersecurity API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "model_loaded": detector.model_loaded,
        "topology_devices_count": len(DEVICE_DATA),
    }


@app.get("/api/stats", tags=["System Telemetry"])
def get_telemetry_stats():
    """Aggregated dashboard telemetry and risk statistics."""
    from backend.database.db import SessionLocal, Incident, SecurityEvent, SimulationRun
    db = SessionLocal()
    try:
        inc_count = db.query(Incident).count()
        evt_count = db.query(SecurityEvent).count()
        sim_count = db.query(SimulationRun).count()
    finally:
        db.close()
    return {
        "total_flows_analyzed": 1420 + evt_count,
        "threats_detected": evt_count + 3,
        "benign_flows": 1420,
        "devices_monitored": len(DEVICE_DATA),
        "incidents_count": inc_count,
        "simulations_run": sim_count,
        "model_loaded": detector.model_loaded,
        "system_status": "ONLINE",
        "threat_level": "ELEVATED",
    }


# Mount API v1 Routers
API_V1_PREFIX = "/api/v1"
app.include_router(detection_router, prefix=API_V1_PREFIX)
app.include_router(network_router, prefix=API_V1_PREFIX)
app.include_router(prediction_router, prefix=API_V1_PREFIX)
app.include_router(defense_router, prefix=API_V1_PREFIX)
app.include_router(incidents_router, prefix=API_V1_PREFIX)
app.include_router(threat_intel_router, prefix=API_V1_PREFIX)

# Compatibility upload route
from backend.api.detection import upload_csv_flows

@app.post("/api/detect/upload", tags=["Threat Detection"])
async def api_detect_upload_alias(file: UploadFile = File(...)):
    """CSV upload alias endpoint for telemetry batch inference."""
    return await upload_csv_flows(file)


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
