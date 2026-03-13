"""
SteadyPocket AI Service — FastAPI entry point
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.verify import router as verify_router
from utils.logger import logger

app = FastAPI(
    title="SteadyPocket AI Service",
    description="Document OCR, face verification, and Govt ID validation",
    version="1.0.0",
)

# CORS — only the Node.js gateway should call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(verify_router, prefix="/verify", tags=["verification"])

# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    logger.info({"event": "health_check"})
    return {"status": "ok", "service": "steadypocket-ai"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
