const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  // No hard-coded fallback — the process should not run without this.
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '1h';
}

function createAccessToken(userId) {
  return jwt.sign(
    { sub: userId }, // user id only — no email, password, or hash
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn(), algorithm: 'HS256' } // HMAC-SHA256 only
  );
}

function toLoginResponse(token) {
  // token only — no user fields, password, or hash
  return { token };
}

function verifyAccessToken(token) {
  // Signature, expiry, and algorithm — HS256 only, not "none" or another alg
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  createAccessToken,
  toLoginResponse,
  verifyAccessToken,
};
