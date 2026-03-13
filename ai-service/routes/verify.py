"""
Verify routes — POST /verify/swiggy-id, /verify/selfie, /verify/govt-id
All routes receive multipart/form-data from the Node.js gateway.
"""
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

from services.ocr_service    import verify_swiggy_id
from services.face_service   import verify_selfie
from services.govt_id_service import verify_govt_id
from models.schemas          import SwiggyIDResponse, SelfieResponse, GovtIDResponse
from utils.logger            import logger
from utils.errors            import ErrorCode

router = APIRouter()


# ─── POST /verify/swiggy-id ──────────────────────────────────────────────────
@router.post("/swiggy-id", response_model=SwiggyIDResponse)
async def verify_swiggy_id_route(
    image:   UploadFile = File(..., description="Swiggy partner ID card image"),
    user_id: str        = Form(""),
    phone:   str        = Form(""),
):
    logger.info({"event": "swiggy_id_route", "user_id": user_id})
    image_bytes = await image.read()

    try:
        result = verify_swiggy_id(image_bytes)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error({"event": "swiggy_id_error", "error": str(exc)})
        return JSONResponse(
            status_code=500,
            content={"error": ErrorCode.AI_SERVICE_ERROR, "detail": str(exc)},
        )


# ─── POST /verify/selfie ─────────────────────────────────────────────────────
@router.post("/selfie", response_model=SelfieResponse)
async def verify_selfie_route(
    selfie:   UploadFile = File(..., description="Live selfie photo"),
    id_photo: UploadFile = File(..., description="Photo from the ID card"),
    user_id:  str        = Form(""),
    phone:    str        = Form(""),
):
    logger.info({"event": "selfie_route", "user_id": user_id})
    selfie_bytes   = await selfie.read()
    id_photo_bytes = await id_photo.read()

    try:
        result = verify_selfie(selfie_bytes, id_photo_bytes)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error({"event": "selfie_error", "error": str(exc)})
        return JSONResponse(
            status_code=500,
            content={"error": ErrorCode.AI_SERVICE_ERROR, "detail": str(exc)},
        )


# ─── POST /verify/govt-id ────────────────────────────────────────────────────
@router.post("/govt-id", response_model=GovtIDResponse)
async def verify_govt_id_route(
    document:    UploadFile = File(..., description="Government ID document image"),
    user_id:     str        = Form(""),
    phone:       str        = Form(""),
    swiggy_name: str        = Form("", description="Name extracted from Swiggy ID (optional for cross-matching)"),
):
    logger.info({"event": "govt_id_route", "user_id": user_id})
    document_bytes = await document.read()

    try:
        result = verify_govt_id(document_bytes, swiggy_name or None)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error({"event": "govt_id_error", "error": str(exc)})
        return JSONResponse(
            status_code=500,
            content={"error": ErrorCode.AI_SERVICE_ERROR, "detail": str(exc)},
        )
