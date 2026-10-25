# ØMEN — Predictive Cyber Threat Intelligence & Autonomous Defense Simulation System

```text
       ___   __  __  _____  _   _
      / _ \ |  \/  || ____|| \ | |
     | | | || |\/| ||  _|  |  \| |
     | |_| || |  | || |___ | |\  |
      \___/ |_|  |_||_____||_| \_|
  AUTONOMOUS CYBER DEFENSE & CTI ENGINE
```

---

## 1. Project Overview

**ØMEN** is a cybersecurity telemetry, threat detection, predictive attack-path modeling, and autonomous defense simulation system. It pairs a high-performance **Python FastAPI** backend with a gothic, black-chrome, crimson **React (Vite + Tailwind)** command dashboard.

### Core Modules & Capabilities

1. **Threat Detection (`backend/detection/`)**:
   - Ingests validated security flow telemetry (IPs, ports, protocols, flow duration, packet volume, byte density, payload entropy, flag signatures).
   - Real **Scikit-learn RandomForestClassifier** inference (`backend/models/threat_detector.joblib`) producing genuine classification probabilities across `BENIGN`, `PORT_SCAN`, `BRUTE_FORCE`, `EXPLOITATION`, and `LATERAL_MOVEMENT`.
   - Deterministic behavioral fallback rules when running in zero-model mode.

2. **Network Topology Graph Engine (`backend/graph_engine/`)**:
   - Models a synthetic 15-device enterprise network in **NetworkX** across Perimeter DMZ, Core Infrastructure, Corporate LAN, and Restricted Crown Jewels.
   - Nodes track device criticality (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), real CVSS vulnerabilities, isolation status, and compromise flags.

3. **Predictive Attack Path Discovery (`backend/path_prediction/`)**:
   - Graph-based path discovery using all-simple-paths and shortest-path heuristics.
   - Calculates path risk scores based on vulnerability density, target asset criticality, and traversal friction.
   - Maps each hop to documented **MITRE ATT&CK** techniques (e.g., `T1190`, `T1046`, `T1021`, `T1078`, `T1558`, `T1486`).

4. **Autonomous Defense Simulation (`backend/defense/`)**:
   - Sandbox simulation of zero-trust workstation/server isolation.
   - Quantifies before/after blast radius reduction, containment efficacy percentage, and shielding of high-value crown jewels.
   - Strictly an educational simulation — no live network modifications are executed.

5. **Incident Memory & Audit (`backend/database/` & `backend/memory/`)**:
   - High-assurance persistence using **SQLite** and **SQLAlchemy**.
   - Maintains immutable records of security events, incidents, and defense simulation runs.

---

## 2. Project Directory Structure

```text
OMEN/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Overview.tsx
│   │   │   ├── NetworkView.tsx
│   │   │   ├── Detection.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── History.tsx
│   │   │   └── System.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── BackendContext.tsx
│   │   ├── styles/
│   │   │   └── index.css
│   │   └── types/
│   │       └── index.ts
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── pytest.ini
│   ├── api/
│   │   ├── __init__.py
│   │   ├── detection.py
│   │   ├── network.py
│   │   ├── prediction.py
│   │   ├── defense.py
│   │   └── incidents.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── threat_detector.joblib
│   ├── detection/
│   │   ├── __init__.py
│   │   ├── detector.py
│   │   └── train_baseline.py
│   ├── graph_engine/
│   │   ├── __init__.py
│   │   └── topology.py
│   ├── path_prediction/
│   │   ├── __init__.py
│   │   └── path_analyzer.py
│   ├── defense/
│   │   ├── __init__.py
│   │   └── defense_simulator.py
│   ├── memory/
│   │   └── __init__.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── db.py
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       └── test_api.py
└── README.md
```

---

## 3. Quick Start — PowerShell Launch Commands

### A. Start the Backend API Server

Open a PowerShell terminal in the project root:

```powershell
cd "c:\Users\TRB\modified mindspace sdg\CrediAI\omen\backend"
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- API Base: `http://127.0.0.1:8000`
- Interactive OpenAPI Documentation: `http://127.0.0.1:8000/docs`
- Health Telemetry: `http://127.0.0.1:8000/health`

### B. Start the Frontend React Dashboard

Open a second PowerShell terminal in the project root:

```powershell
cd "c:\Users\TRB\modified mindspace sdg\CrediAI\omen\frontend"
npm run dev
```

- Local Dashboard: `http://localhost:5173`

---

## 4. Running Backend Test Suite

To verify all endpoints, graph queries, threat models, and incident database routines:

```powershell
cd "c:\Users\TRB\modified mindspace sdg\CrediAI\omen\backend"
.\.venv\Scripts\pytest.exe -v
```

All 11 baseline verification tests pass across `/health`, `/docs`, `/api/v1/network/graph`, `/api/v1/detection/analyze`, `/api/v1/prediction/attack-paths`, `/api/v1/defense/simulate-isolation`, and `/api/v1/incidents`.
