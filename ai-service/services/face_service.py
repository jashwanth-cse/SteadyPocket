"""
Face Verification Service — Production Grade
=============================================
Uses facenet-pytorch for accurate face verification:
  • MTCNN          — robust multi-scale face detection & alignment
  • InceptionResnetV1 (VGGFace2) — FaceNet embeddings, state-of-the-art accuracy
  • Cosine similarity on L2-normalised 512-d embeddings

Why facenet-pytorch over DeepFace/FaceNet512:
  - VGGFace2-trained model is specifically optimised for face VERIFICATION
  - MTCNN is far more robust than OpenCV Haar cascades across lighting conditions
  - Works on CPU without any C++ compilation (unlike InsightFace on Windows)

Threshold guidance (cosine similarity, VGGFace2 model):
  > 0.80  →  strict (twins, passport conditions)
  > 0.65  →  default (webcam vs ID card across different lighting)
  > 0.50  →  lenient (heavy occlusion, extreme age gap)
"""
import os
import io
import numpy as np
import cv2
from PIL import Image

from utils.logger import logger

# ── Configuration ──────────────────────────────────────────────────────────────
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.65"))

# Lazily-initialised models (download once on first request, ~100 MB)
_mtcnn   = None
_resnet  = None


def _load_models():
    """Lazy-load MTCNN + InceptionResnetV1 so uvicorn startup isn't blocked."""
    global _mtcnn, _resnet

    if _mtcnn is None or _resnet is None:
        import torch
        from facenet_pytorch import MTCNN, InceptionResnetV1

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        _mtcnn = MTCNN(
            image_size=160,
            margin=20,           # add margin around detected face
            keep_all=False,      # return only the best (most likely) face
            min_face_size=40,    # detect faces >= 40px — handles distant faces
            thresholds=[0.6, 0.7, 0.7],  # P-net, R-net, O-net confidence
            device=device,
        )

        _resnet = InceptionResnetV1(
            pretrained="vggface2",
        ).eval().to(device)

        logger.info({"event": "facenet_loaded", "device": str(device), "model": "VGGFace2"})

    return _mtcnn, _resnet


# ── Helpers ────────────────────────────────────────────────────────────────────
def _bytes_to_pil(image_bytes: bytes, label: str = "image") -> Image.Image:
    """Convert raw bytes → PIL RGB image."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return img
    except Exception as e:
        raise ValueError(f"[{label}] Cannot decode image: {e}")


def _apply_clahe(pil_img: Image.Image) -> Image.Image:
    """CLAHE contrast enhancement — helps with dark / overexposed images."""
    bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    bgr_out = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    return Image.fromarray(cv2.cvtColor(bgr_out, cv2.COLOR_BGR2RGB))


def _get_embedding(pil_img: Image.Image, label: str = "image") -> "np.ndarray | None":
    """
    Detect face with MTCNN and extract 512-d FaceNet embedding.
    Tries multiple detection configurations to handle glasses, lighting, pose.
    Returns L2-normalised embedding, or None if no face found at all.
    """
    import torch

    mtcnn, resnet = _load_models()

    # ── Attempt 1: CLAHE-enhanced image, standard margin ────────────────────
    enhanced = _apply_clahe(pil_img)
    face_tensor = mtcnn(enhanced)

    # ── Attempt 2: original image, larger margin (helps with glasses/hats) ──
    if face_tensor is None:
        logger.info({"event": "retry_detection", "label": label, "reason": "first_pass_failed"})
        face_tensor = mtcnn(pil_img)

    # ── Attempt 3: lower MTCNN thresholds (more lenient detection) ──────────
    if face_tensor is None:
        logger.info({"event": "retry_detection", "label": label, "reason": "lenient_mode"})
        import torch as _torch
        from facenet_pytorch import MTCNN as _MTCNN
        lenient_mtcnn = _MTCNN(
            image_size=160,
            margin=40,
            thresholds=[0.5, 0.6, 0.6],   # much more lenient — catches partial faces
            keep_all=True,                  # return ALL detected faces, pick best
            device=next(resnet.parameters()).device,
        )
        faces = lenient_mtcnn(pil_img, return_prob=True)
        if faces[0] is not None:
            tensors, probs = faces
            if tensors.dim() == 3:
                tensors = tensors.unsqueeze(0)
                probs = [probs]
            # Pick the face with the highest detection probability
            best_idx = int(np.argmax(probs))
            face_tensor = tensors[best_idx]

    if face_tensor is None:
        logger.warning({"event": "face_not_detected", "label": label})
        return None

    logger.info({"event": "face_detected", "label": label})

    with torch.no_grad():
        if face_tensor.dim() == 3:
            face_tensor = face_tensor.unsqueeze(0)
        embedding = resnet(face_tensor.to(next(resnet.parameters()).device))
        embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)
    return embedding.squeeze().cpu().numpy()


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity for L2-normalised vectors → dot product."""
    return float(np.dot(a, b))


# ── Public API ─────────────────────────────────────────────────────────────────
def verify_selfie(selfie_bytes: bytes, id_photo_bytes: bytes) -> dict:
    """
    Compare a live selfie against an ID card photo.

    Returns:
        { match_score: float[0..1], verified: bool }
        or on error:
        { match_score: 0.0, verified: False, reason: str }
    """
    logger.info({"event": "face_verification_start", "threshold": FACE_MATCH_THRESHOLD})

    try:
        selfie_pil   = _bytes_to_pil(selfie_bytes,   label="selfie")
        id_photo_pil = _bytes_to_pil(id_photo_bytes, label="id_photo")
    except ValueError as e:
        logger.error({"event": "image_decode_error", "error": str(e)})
        return {"match_score": 0.0, "verified": False, "reason": str(e)}

    selfie_emb   = _get_embedding(selfie_pil,   label="selfie")
    id_photo_emb = _get_embedding(id_photo_pil, label="id_photo")

    if selfie_emb is None or id_photo_emb is None:
        missing = "selfie" if selfie_emb is None else "id_photo"
        logger.warning({"event": "face_not_detected", "missing": missing})
        return {"match_score": 0.0, "verified": False, "reason": f"face_not_detected:{missing}"}

    raw_score = _cosine_similarity(selfie_emb, id_photo_emb)
    # Map [-1, 1] → [0, 1] for display; keep raw for threshold comparison
    score_01  = round((raw_score + 1) / 2, 4)
    verified  = raw_score >= FACE_MATCH_THRESHOLD

    logger.info({
        "event":        "face_verification_complete",
        "raw_score":    round(raw_score, 4),
        "match_score":  score_01,
        "verified":     verified,
        "threshold":    FACE_MATCH_THRESHOLD,
    })

    if not verified:
        logger.warning({"event": "face_mismatch", "score": round(raw_score, 4)})

    return {"match_score": score_01, "verified": verified}
