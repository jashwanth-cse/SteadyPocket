'use strict';
/**
 * verifyFirebaseToken middleware
 *
 * Production: verifies Firebase ID token via Admin SDK → attaches req.user
 * Dev mode (no service account): decodes JWT header to extract uid/phone — 
 *   skips cryptographic verification so local dev works without credentials.
 */
const admin  = require('../config/firebase');
const logger = require('../config/logger');

/** Decode a JWT payload without verifying the signature (dev-mode only) */
function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split('.');
    // Base64url → Base64 → JSON
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'MISSING_AUTH_TOKEN' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  // ── Production path: full cryptographic verification ──────────────────────
  if (admin && admin.apps && admin.apps.length > 0) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.user = { uid: decoded.uid, phone_number: decoded.phone_number };
      logger.info({ event: 'token_verified', uid: req.user.uid });
      return next();
    } catch (err) {
      logger.warn({ event: 'token_invalid', error: err.message });
      return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
    }
  }

  // ── Dev-mode fallback: decode without verification ────────────────────────
  if (process.env.APP_MODE === 'dev') {
    const payload = decodeJwtPayload(idToken);
    if (!payload || !payload.sub) {
      logger.warn({ event: 'token_invalid', error: 'Cannot decode JWT in dev mode' });
      return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
    }
    req.user = {
      uid:          payload.sub,
      phone_number: payload.phone_number ?? payload.phone ?? null,
    };
    logger.info({ event: 'token_dev_bypass', uid: req.user.uid });
    return next();
  }

  // Production without admin SDK configured — reject
  return res.status(500).json({ error: 'Firebase Admin not initialised' });
}

module.exports = verifyFirebaseToken;
