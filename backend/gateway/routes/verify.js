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
    { name: 'selfie',   maxCount: 1 },
    { name: 'id_photo', maxCount: 1 },
  ]),
  async (req, res) => {
    logger.info({ event: 'selfie_request', uid: req.user.uid, phone: req.user.phone_number });

    const form = new FormData();

    // 1. Attach the live selfie (sent as file from the app)
    const selfieFile = req.files?.['selfie']?.[0];
    if (!selfieFile) {
      logger.error({ event: 'selfie_missing_file', uid: req.user.uid, files: Object.keys(req.files || {}) });
      return res.status(400).json({ error: 'MISSING_SELFIE', message: 'selfie file is required' });
    }
    logger.info({ event: 'selfie_file_received', uid: req.user.uid, size: selfieFile.size });
    form.append('selfie', selfieFile.buffer, {
      filename:    selfieFile.originalname || 'selfie.jpg',
      contentType: selfieFile.mimetype     || 'image/jpeg',
    });

    // 2. Attach the ID photo — either as a direct file upload or by downloading the URL
    const idPhotoFile = req.files?.['id_photo']?.[0];
    const idPhotoUrl  = req.body?.id_photo_url;

    if (idPhotoFile) {
      // App sent the image bytes directly
      form.append('id_photo', idPhotoFile.buffer, {
        filename:    idPhotoFile.originalname || 'id_photo.jpg',
        contentType: idPhotoFile.mimetype     || 'image/jpeg',
      });
    } else if (idPhotoUrl) {
      // App sent a URL (e.g. Cloud Storage) — download it in the gateway
      try {
        const imgRes = await axios.get(idPhotoUrl, { responseType: 'arraybuffer', timeout: 10_000 });
        form.append('id_photo', Buffer.from(imgRes.data), {
          filename:    'id_photo.jpg',
          contentType: imgRes.headers['content-type'] || 'image/jpeg',
        });
      } catch (dlErr) {
        logger.error({ event: 'id_photo_download_failed', url: idPhotoUrl, error: dlErr.message });
        return res.status(400).json({ error: 'ID_PHOTO_DOWNLOAD_FAILED', message: 'Could not fetch profile image from URL' });
      }
    } else {
      return res.status(400).json({ error: 'MISSING_ID_PHOTO', message: 'id_photo file or id_photo_url is required' });
    }

    // 3. Append metadata
    form.append('user_id', req.user.uid);
    form.append('phone',   req.user.phone_number || '');

    // Log where we're sending the request
    logger.info({ event: 'fastapi_forward_start', uid: req.user.uid, endpoint: `${FASTAPI}/verify/selfie`, fastapi_url: FASTAPI });

    try {
      const response = await axios.post(`${FASTAPI}/verify/selfie`, form, {
        headers: { ...form.getHeaders(), 'x-user-id': req.user.uid },
        timeout: 60_000,
      });
      logger.info({ event: 'fastapi_success', endpoint: '/verify/selfie', uid: req.user.uid, status: response.status });
      return res.status(response.status).json(response.data);
    } catch (err) {
      const status = err.response?.status || 502;
      const data   = err.response?.data   || { error: 'AI_SERVICE_UNAVAILABLE' };
      logger.error({
        event: 'fastapi_error',
        endpoint: '/verify/selfie',
        uid: req.user.uid,
        status,
        fastapi_url: FASTAPI,
        error: err.message,
        code: err.code,
      });
      return res.status(status).json(data);
    }
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
