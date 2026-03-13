"""
Pydantic schemas for request and response models.
"""
from pydantic import BaseModel
from typing import Optional


# ── Swiggy ID ─────────────────────────────────────────────────────────────
class SwiggyIDResponse(BaseModel):
    partner_id:          Optional[str] = None
    name:                Optional[str] = None
    mobile_number:       Optional[str] = None
    verification_status: str = "success"


# ── Selfie / Face ─────────────────────────────────────────────────────────
class SelfieResponse(BaseModel):
    match_score: float
    verified:    bool


# ── Govt ID ───────────────────────────────────────────────────────────────
class GovtIDResponse(BaseModel):
    verified: bool


# ── Error ────────────────────────────────────────────────────────────────
class ErrorResponse(BaseModel):
    error:   str
    detail:  Optional[str] = None
