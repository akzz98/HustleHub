const fs = require('fs');

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

function readSslFile(filePath, missingMessage) {
  try {
    return fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(missingMessage);
  }
}

function readSslMaterials() {
  const key = readSslFile(
    getSslKeyPath(),
    'SSL key file is missing. Create it using the Local SSL certificate section in README.md.'
  );
  const cert = readSslFile(
    getSslCertPath(),
    'SSL certificate file is missing. Create it using the Local SSL certificate section in README.md.'
  );

  return { key, cert };
}

module.exports = {
  getSslKeyPath,
  getSslCertPath,
  readSslMaterials,
};
