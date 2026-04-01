"""
SteadyPocket AI Service — FastAPI entry point
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.verify import router as verify_router
from routes.disruption import router as disruption_router
from utils.logger import logger

app = FastAPI(
    title="SteadyPocket AI Service",
    description="Document OCR, face verification, and Govt ID validation",
    version="1.0.0",
)

# CORS — allow gateway URL + localhost (configurable via env for security)
import os as _os
_raw = _os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw.split(",")] if _raw != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_raw != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(verify_router, prefix="/verify", tags=["verification"])
app.include_router(disruption_router, prefix="/check-disruptions", tags=["disruption"])

# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    logger.info({"event": "health_check"})
    return {"status": "ok", "service": "steadypocket-ai"}


if __name__ == "__main__":
    import uvicorn
    import os as _os
    _port = int(_os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=_port, reload=False, log_level="info")
