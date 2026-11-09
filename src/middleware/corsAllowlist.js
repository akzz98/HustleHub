function resolveAllowedOrigin() {
  return String(process.env.CLIENT_ORIGIN || '').trim();
}

function assertCorsConfigured() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (!resolveAllowedOrigin()) {
    throw new Error(
      'CLIENT_ORIGIN must be set to the allowed browser origin (for example http://localhost:5173).'
    );
  }
}

function createCorsMiddleware() {
  assertCorsConfigured();

  return function corsAllowlist(req, res, next) {
    const origin = req.headers.origin;
    const allowedOrigin = resolveAllowedOrigin();

    // No Origin header: curl, Postman, Vite proxy, and automated API tests.
    if (!origin) {
      return next();
    }

    // Test runs may omit CLIENT_ORIGIN; browser Origins are only checked when it is set.
    if (!allowedOrigin) {
      return next();
    }

    if (origin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
      );

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      return next();
    }

    return res.status(403).json({ error: 'Origin not allowed.' });
  };
}

module.exports = {
  createCorsMiddleware,
  assertCorsConfigured,
  resolveAllowedOrigin,
};
