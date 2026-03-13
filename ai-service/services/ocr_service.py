"""
Swiggy ID OCR Service
- Accepts image file (BytesIO)
- Runs Google Cloud Vision OCR to extract raw text
- Passes raw text to Gemini AI to structure into partner fields
"""
import os
import io
import json
from google.cloud import vision
import google.generativeai as genai

from utils.logger import logger
from utils.errors import raise_verification_error, ErrorCode

# Initialise Gemini
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Initialise Vision client
vision_client = vision.ImageAnnotatorClient()


def _run_ocr(image_bytes: bytes) -> str:
    """Feed image bytes to Cloud Vision and return all extracted text."""
    image = vision.Image(content=image_bytes)
    response = vision_client.text_detection(image=image)

    if response.error.message:
        logger.error({"event": "ocr_api_error", "detail": response.error.message})
        raise_verification_error(ErrorCode.OCR_FAILED, response.error.message, 502)

    texts = response.text_annotations
    if not texts:
        raise_verification_error(ErrorCode.OCR_NO_TEXT, "No text detected in the image")

    return texts[0].description  # full document text in annotation 0


def _structure_with_gemini(raw_text: str) -> dict:
    """Ask Gemini to parse raw OCR text into Swiggy partner fields."""
    prompt = f"""
You are a document parser. Extract the following fields from this Swiggy delivery partner ID card text.
Return ONLY a valid JSON object with keys: partner_id, name, mobile_number.
If a field is not found, use null.

OCR Text:
{raw_text}

JSON:"""

    response = gemini_model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        logger.warning({"event": "gemini_parse_error", "raw": raw})
        return {"partner_id": None, "name": None, "mobile_number": None}


def verify_swiggy_id(image_bytes: bytes) -> dict:
    """Main entry point called by the route handler."""
    logger.info({"event": "swiggy_id_ocr_start", "size_bytes": len(image_bytes)})
    raw_text = _run_ocr(image_bytes)
    logger.info({"event": "ocr_complete", "char_count": len(raw_text)})
    structured = _structure_with_gemini(raw_text)

    return {
        "partner_id":          structured.get("partner_id"),
        "name":                structured.get("name"),
        "mobile_number":       structured.get("mobile_number"),
        "verification_status": "success",
    }
