'use strict';

// Load env only for LOCAL development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

require('express-async-errors');

const express = require('express');
const cors = require('cors');

// ── Safe Imports (catch crashes early) ───────────────────────────────────────
let logger;
let verifyRoutes;

try {
  logger = require('./config/logger');
  console.log("✅ Logger loaded");
} catch (err) {
  console.error("❌ Failed to load logger:", err);
  process.exit(1);
}

try {
  verifyRoutes = require('./routes/verify');
  console.log("✅ verifyRoutes loaded");
} catch (err) {
  console.error("❌ Failed to load verifyRoutes:", err);
  process.exit(1);
}

// ── Firebase Admin (Production Safe) ─────────────────────────────────────────


// ── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

console.log("🚀 Booting SteadyPocket API...");

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request Logger
app.use((req, _res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.APP_MODE || 'unknown',
    service: 'steadypocket-gateway',
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/verify', verifyRoutes);

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
});

// ── Crash Handlers (VERY IMPORTANT) ─────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// ── Start Server (Cloud Run Compatible) ─────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Mode: ${process.env.APP_MODE}`);
});