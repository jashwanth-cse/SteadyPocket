'use strict';
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const logger  = require('./config/logger');
const verifyRoutes = require('./routes/verify');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logger
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip });
  next();
});

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: process.env.APP_MODE, service: 'steadypocket-gateway' });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/verify', verifyRoutes);

// ── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
});

app.listen(PORT, () => {
  logger.info(`✅ SteadyPocket API Gateway running on port ${PORT} [mode: ${process.env.APP_MODE}]`);
});
