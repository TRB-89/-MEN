# ØMEN Cyber Threat Intelligence Backend
# Production Multi-Stage / Lightweight Container

FROM python:3.11-slim AS runtime

WORKDIR /app

# Install system dependencies (build essentials for fast c-extensions if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-optimized PyTorch first (avoids multi-gigabyte CUDA bloat)
RUN pip install --no-cache-dir torch>=2.2.0 --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install runtime dependencies
COPY backend/requirements-runtime.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase and scripts
COPY backend /app/backend
COPY scripts /app/scripts

# Pre-populate threat intel datasets from bundled samples if not present
RUN python /app/scripts/setup_intelligence.py --sample-only || true

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    CORS_ORIGINS="*"

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/v1/network/health || exit 1

# Launch FastAPI backend with uvicorn
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
