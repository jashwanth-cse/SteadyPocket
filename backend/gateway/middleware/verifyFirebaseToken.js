'use strict';
/**
 * verifyFirebaseToken middleware
 *
 * Validates the Firebase ID token from the Authorization header.
 * On success, attaches req.user = { uid, phone_number, ... }
 * On failure, returns 401.
 */
const admin  = require('../config/firebase');
const logger = require('../config/logger');

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'MISSING_AUTH_TOKEN' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid:          decodedToken.uid,
      phone_number: decodedToken.phone_number,
    };
    logger.info({ event: 'token_verified', uid: req.user.uid });
    next();
  } catch (err) {
    logger.warn({ event: 'token_invalid', error: err.message });
    return res.status(401).json({ error: 'INVALID_AUTH_TOKEN' });
  }
}

module.exports = verifyFirebaseToken;
