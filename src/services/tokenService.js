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

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
};
