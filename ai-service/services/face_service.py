"""
Face Verification Service
- Accepts two images (selfie bytes, id_photo bytes)
- Uses DeepFace to extract embeddings from both
- Computes cosine similarity
- Returns match_score and verified (True if score >= threshold)
"""
import os
import io
import numpy as np
import cv2
from deepface import DeepFace

from utils.logger import logger
from utils.errors import raise_verification_error, ErrorCode

FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.85"))


def _bytes_to_bgr(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a BGR numpy array (OpenCV format)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise_verification_error(ErrorCode.FACE_NOT_DETECTED, "Could not decode image")
    return img


def _get_embedding(img: np.ndarray) -> np.ndarray:
    """Extract FaceNet512 embedding for the first detected face."""
    try:
        result = DeepFace.represent(
            img_path=img,
            model_name="Facenet512",
            enforce_detection=True,
            detector_backend="opencv",
        )
        # result is a list; take the first face
        return np.array(result[0]["embedding"])
    except Exception as exc:
        logger.warning({"event": "face_embedding_failed", "error": str(exc)})
        raise_verification_error(ErrorCode.FACE_NOT_DETECTED, str(exc))


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity in [0, 1]."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def verify_selfie(selfie_bytes: bytes, id_photo_bytes: bytes) -> dict:
    """Compare a live selfie against an ID card photo."""
    logger.info({"event": "face_verification_start"})

    selfie_img  = _bytes_to_bgr(selfie_bytes)
    id_photo_img = _bytes_to_bgr(id_photo_bytes)

    selfie_emb   = _get_embedding(selfie_img)
    id_photo_emb = _get_embedding(id_photo_img)

    score = _cosine_similarity(selfie_emb, id_photo_emb)
    verified = score >= FACE_MATCH_THRESHOLD

    logger.info({
        "event":        "face_verification_complete",
        "match_score":  round(score, 4),
        "verified":     verified,
        "threshold":    FACE_MATCH_THRESHOLD,
    })

    if not verified:
        logger.warning({"event": "face_mismatch", "score": round(score, 4)})

    return {"match_score": round(score, 4), "verified": verified}
