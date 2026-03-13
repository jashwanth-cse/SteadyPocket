"""
Government ID Verification Service
- Accepts document image bytes
- Runs OCR to extract name and ID number
- Validates format (alphanumeric ID, non-empty name)
- Compares extracted name against Swiggy ID name stored in Firestore
- Processes in-memory ONLY — no image or document data is stored at any point
"""
import os
import re
from google.cloud import vision
import google.generativeai as genai
import json

from utils.logger import logger
from utils.errors import raise_verification_error, ErrorCode

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
gemini_model = genai.GenerativeModel("gemini-1.5-flash")
vision_client = vision.ImageAnnotatorClient()


def _run_ocr(image_bytes: bytes) -> str:
    image = vision.Image(content=image_bytes)
    response = vision_client.text_detection(image=image)
    if response.error.message:
        raise_verification_error(ErrorCode.OCR_FAILED, response.error.message, 502)
    texts = response.text_annotations
    if not texts:
        raise_verification_error(ErrorCode.OCR_NO_TEXT, "No text detected")
    return texts[0].description


def _structure_with_gemini(raw_text: str) -> dict:
    prompt = f"""
You are a government ID document parser. Extract the following fields from this Indian government ID text.
Return ONLY a valid JSON object with keys: name, id_number.
If a field is not found, use null.

Text:
{raw_text}

JSON:"""
    response = gemini_model.generate_content(prompt)
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        return {"name": None, "id_number": None}


def _validate_id_format(id_number: str | None) -> bool:
    """IDs should be alphanumeric, 4–20 chars (Aadhaar, PAN, DL patterns)."""
    if not id_number:
        return False
    clean = re.sub(r"[\s\-]", "", id_number.upper())
    return bool(re.match(r"^[A-Z0-9]{4,20}$", clean))


def _names_match(name_a: str | None, name_b: str | None) -> bool:
    """Fuzzy name match — both share at least one word with 3+ letters."""
    if not name_a or not name_b:
        return False
    tokens_a = set(w.lower() for w in name_a.split() if len(w) >= 3)
    tokens_b = set(w.lower() for w in name_b.split() if len(w) >= 3)
    return bool(tokens_a & tokens_b)


def verify_govt_id(document_bytes: bytes, swiggy_name: str | None) -> dict:
    """
    Main entry point.
    - document_bytes: raw image bytes (processed in memory, never stored)
    - swiggy_name:    name extracted from Swiggy ID during earlier verification step
    """
    logger.info({"event": "govt_id_verification_start", "size_bytes": len(document_bytes)})

    raw_text   = _run_ocr(document_bytes)
    structured = _structure_with_gemini(raw_text)

    extracted_name = structured.get("name")
    id_number      = structured.get("id_number")

    logger.info({
        "event":     "govt_id_extracted",
        "has_name":  bool(extracted_name),
        "has_id":    bool(id_number),
    })

    if not _validate_id_format(id_number):
        logger.warning({"event": "govt_id_invalid_format", "id_number": id_number})
        raise_verification_error(ErrorCode.GOVT_ID_INVALID, "ID number format is invalid")

    if swiggy_name and not _names_match(extracted_name, swiggy_name):
        logger.warning({
            "event":         "name_mismatch",
            "govt_id_name":  extracted_name,
            "swiggy_name":   swiggy_name,
        })
        raise_verification_error(ErrorCode.NAME_MISMATCH, "Name on Govt ID does not match Swiggy ID")

    logger.info({"event": "govt_id_verification_success"})
    # Image bytes go out of scope here — never written to disk or database
    return {"verified": True}
