const rateLimit = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_PRODUCTION = 20; // register + login share this bucket per IP
const BOOKING_MAX_PRODUCTION = 30; // create + list bookings per IP
const TEST_MAX = 1000; // raised under Jest so other suites stay green

function createRateLimiter({ maxProduction, windowMs, max }) {
  const isTest = process.env.NODE_ENV === 'test';
  const resolvedMax =
    max !== undefined ? max : isTest ? TEST_MAX : maxProduction;

  return rateLimit({
    windowMs: windowMs ?? WINDOW_MS,
    max: resolvedMax,
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false, // disable X-RateLimit-*
    message: { error: 'Too many requests, please try again later.' },
  });
}

// Auth endpoints are brute-force targets.
function createAuthRateLimiter(options = {}) {
  return createRateLimiter({
    maxProduction: AUTH_MAX_PRODUCTION,
    windowMs: options.windowMs,
    max: options.max,
  });
}

// Booking create/list — slows spam bookings and transaction noise.
function createBookingRateLimiter(options = {}) {
  return createRateLimiter({
    maxProduction: BOOKING_MAX_PRODUCTION,
    windowMs: options.windowMs,
    max: options.max,
  });
}

const authRateLimiter = createAuthRateLimiter();
const bookingRateLimiter = createBookingRateLimiter();

module.exports = {
  createAuthRateLimiter,
  createBookingRateLimiter,
  authRateLimiter,
  bookingRateLimiter,
};
