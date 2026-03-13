'use strict';
/**
 * devBypass middleware
 *
 * When APP_MODE=dev, allows whitelisted test phone numbers to skip
 * all verification checks and receive mocked success responses.
 *
 * Supported test numbers (digits only):
 *   9999999999  — master test account
 *   8888888888  — secondary test account
 *
 * If the request's user phone ends with one of these, the middleware
 * short-circuits and returns a mocked success payload.
 */
const logger = require('../config/logger');

const DEV_TEST_PHONES = (process.env.DEV_TEST_PHONES || '9999999999,8888888888')
  .split(',')
  .map((p) => p.trim());

// Mocked responses per route for dev test accounts
const DEV_MOCK_RESPONSES = {
  '/verify/swiggy-id': {
    partner_id:          'DEV-TEST-001',
    name:                'Test Rider',
    mobile_number:       '9999999999',
    verification_status: 'success',
    dev_bypass:          true,
  },
  '/verify/selfie': {
    match_score: 1.0,
    verified:    true,
    dev_bypass:  true,
  },
  '/verify/govt-id': {
    verified:   true,
    dev_bypass: true,
  },
};

function devBypass(req, res, next) {
  const isDevMode = process.env.APP_MODE === 'dev';

  if (!isDevMode) return next();

  // Normalise phone — strip all non-digits, take last 10 chars
  const rawPhone = (req.user?.phone_number || '').replace(/\D/g, '');
  const last10   = rawPhone.slice(-10);

  if (DEV_TEST_PHONES.includes(last10)) {
    const mockRoute = Object.keys(DEV_MOCK_RESPONSES).find((r) => req.path.startsWith(r));
    if (mockRoute) {
      logger.info({ event: 'dev_bypass', phone: last10, route: req.path });
      return res.json(DEV_MOCK_RESPONSES[mockRoute]);
    }
  }

  next();
}

module.exports = devBypass;
