'use strict';
const admin = require('firebase-admin');
const path  = require('path');

let app;
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.join(__dirname, '../config/serviceAccountKey.json');
  
  const serviceAccount = require(serviceAccountPath);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.apps[0];
}

module.exports = admin;
