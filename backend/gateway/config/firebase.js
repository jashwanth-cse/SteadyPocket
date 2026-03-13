'use strict';
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Option A: Full service account JSON passed as env var (for production/CI)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Option B: Path to local serviceAccountKey.json file
      // IMPORTANT: path.resolve() converts any relative path using process CWD,
      // matching how fs.existsSync behaves. Using __dirname for the default so
      // the file can sit right next to firebase.js inside config/.
      const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : path.join(__dirname, 'serviceAccountKey.json');

      if (!fs.existsSync(keyPath)) {
        if (process.env.APP_MODE === 'dev') {
          console.warn(
            '⚠️  [Firebase] serviceAccountKey.json not found.\n' +
            '   Running in DEV mode — Firebase token verification is DISABLED.\n' +
            '   Download your service account from Firebase Console → Project Settings → Service accounts.\n' +
            '   Save it to: backend/gateway/config/serviceAccountKey.json\n' +
            '   OR set FIREBASE_SERVICE_ACCOUNT env var with the JSON string.\n'
          );
          module.exports = null;
          return;
        }
        throw new Error(`Service account key not found at: ${keyPath}`);
      }

      const serviceAccount = require(keyPath);
      credential = admin.credential.cert(serviceAccount);
    }

    admin.initializeApp({ credential });
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
    if (process.env.APP_MODE !== 'dev') process.exit(1);
  }
}

module.exports = admin.apps.length ? admin : null;
