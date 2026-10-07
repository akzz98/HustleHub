const rateLimit = require('express-rate-limit');

// Auth endpoints are brute-force targets. Tight window; raised under Jest so
// the rest of the suite does not trip the limiter while still testing 429
// behaviour via createAuthRateLimiter({ max }).
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_PRODUCTION = 20; // register + login share this bucket per IP
const AUTH_MAX_TEST = 1000;

function createAuthRateLimiter(options = {}) {
  const isTest = process.env.NODE_ENV === 'test';
  const max =
    options.max !== undefined
      ? options.max
      : isTest
        ? AUTH_MAX_TEST
        : AUTH_MAX_PRODUCTION;

  return rateLimit({
    windowMs: options.windowMs ?? AUTH_WINDOW_MS,
    max,
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false, // disable X-RateLimit-*
    message: { error: 'Too many requests, please try again later.' },
  });
}

const authRateLimiter = createAuthRateLimiter();

module.exports = {
  createAuthRateLimiter,
  authRateLimiter,
};
