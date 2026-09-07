function getSslKeyPath() {
  const value = process.env.SSL_KEY_PATH;

  // No hard-coded path — key location comes from the environment only
  if (!value) {
    throw new Error('SSL_KEY_PATH is not configured.');
  }

  return value;
}

function getSslCertPath() {
  const value = process.env.SSL_CERT_PATH;

  if (!value) {
    throw new Error('SSL_CERT_PATH is not configured.');
  }

  return value;
}

module.exports = {
  getSslKeyPath,
  getSslCertPath,
};
