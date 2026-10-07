// Use after authenticate — relies on req.userRole from the verified JWT.
// Example: router.post('/', authenticate, requireRole('freelancer'), controller.create);

function requireRole(...allowedRoles) {
  return function requireRoleMiddleware(req, res, next) {
    const role = req.userRole;

    // Missing role means authenticate was skipped or the token was incomplete.
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    next();
  };
}

module.exports = {
  requireRole,
};
