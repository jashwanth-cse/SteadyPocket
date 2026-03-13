'use strict';
/**
 * Verification Routes
 *
 * Client → Node Gateway (this file) → FastAPI AI Service → Client
 *
 * All routes:
 *   1. Validate Firebase ID token (verifyFirebaseToken)
 *   2. Short-circuit for dev test accounts (devBypass)
 *   3. Forward multipart/form-data to FastAPI using axios
 */
const express            = require('express');
const multer             = require('multer');
const axios             = require('axios');
const FormData           = require('form-data');
const logger             = require('../config/logger');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const devBypass          = require('../middleware/devBypass');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15 MB
const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';

// ─── Helper: proxy a file upload request to FastAPI ───────────────────────
async function proxyToFastAPI(endpoint, req, res, fileFields) {
  const form = new FormData();

  // Attach files
  for (const field of fileFields) {
    const file = req.files?.[field]?.[0] || req.file;
    if (file) {
      form.append(field, file.buffer, {
        filename:    file.originalname,
        contentType: file.mimetype,
      });
    }
  }

  // Attach body fields (e.g. user_id)
  form.append('user_id', req.user.uid);
  form.append('phone',   req.user.phone_number || '');

  try {
    const response = await axios.post(`${FASTAPI}${endpoint}`, form, {
      headers: {
        ...form.getHeaders(),
        'x-user-id': req.user.uid,
      },
      timeout: 60_000, // 60 s — AI inference can be slow
    });

    logger.info({ event: 'fastapi_success', endpoint, uid: req.user.uid });
    return res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 502;
    const data   = err.response?.data   || { error: 'AI_SERVICE_UNAVAILABLE' };
    logger.error({ event: 'fastapi_error', endpoint, status, error: err.message });
    return res.status(status).json(data);
  }
}

// ─── POST /verify/swiggy-id ──────────────────────────────────────────────
router.post(
  '/swiggy-id',
  verifyFirebaseToken,
  devBypass,
  upload.single('image'),
  async (req, res) => {
    logger.info({ event: 'swiggy_id_request', uid: req.user.uid });
    await proxyToFastAPI('/verify/swiggy-id', req, res, ['image']);
  }
);

// ─── POST /verify/selfie ─────────────────────────────────────────────────
router.post(
  '/selfie',
  verifyFirebaseToken,
  devBypass,
  upload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'id_photo', maxCount: 1 },
  ]),
  async (req, res) => {
    logger.info({ event: 'selfie_request', uid: req.user.uid });
    await proxyToFastAPI('/verify/selfie', req, res, ['selfie', 'id_photo']);
  }
);

// ─── POST /verify/govt-id ────────────────────────────────────────────────
router.post(
  '/govt-id',
  verifyFirebaseToken,
  devBypass,
  upload.single('document'),
  async (req, res) => {
    logger.info({ event: 'govt_id_request', uid: req.user.uid });
    await proxyToFastAPI('/verify/govt-id', req, res, ['document']);
  }
);

module.exports = router;
