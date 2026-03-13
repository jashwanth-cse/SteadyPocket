"""Helpers for structured error responses."""
from fastapi import HTTPException


def raise_verification_error(code: str, detail: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"error": code, "detail": detail},
    )


# Common error codes
class ErrorCode:
    OCR_FAILED            = "OCR_FAILED"
    OCR_NO_TEXT           = "OCR_NO_TEXT"
    FACE_NOT_DETECTED     = "FACE_NOT_DETECTED"
    FACE_VERIFICATION_FAILED = "FACE_VERIFICATION_FAILED"
    GOVT_ID_INVALID       = "GOVT_ID_INVALID"
    NAME_MISMATCH         = "NAME_MISMATCH"
    AI_SERVICE_ERROR      = "AI_SERVICE_ERROR"
    IMAGE_REQUIRED        = "IMAGE_REQUIRED"
