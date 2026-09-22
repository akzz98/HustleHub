const fs = require('fs');
const os = require('os');
const path = require('path');

const uriFile = path.join(os.tmpdir(), 'hustlehub-mongo-test-uri');

if (fs.existsSync(uriFile)) {
  process.env.MONGODB_URI = fs.readFileSync(uriFile, 'utf8').trim();
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-not-for-production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
