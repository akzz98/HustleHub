const tokenService = require('../services/tokenService');

// Express middleware: (req, res, next)
function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const parts = authorization.split(' ');
  const scheme = parts[0];
  const token = parts[1];

  // Must be exactly: Bearer <token>
  if (parts.length !== 2 || scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization header.' });
  }

  try {
    const payload = tokenService.verifyAccessToken(token);

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.userId = payload.sub; // id from the token's sub claim
  } catch (err) {
    // Covers bad signatures and expired tokens. Don't send jwt's error text out.
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  next();
}

module.exports = {
  authenticate,
};
