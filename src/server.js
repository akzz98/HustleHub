require('dotenv').config(); // loads variables from .env

const app = require('./app');
const tokenService = require('./services/tokenService');
const sslConfig = require('./utils/sslConfig');

tokenService.getJwtSecret(); // quit if JWT_SECRET is missing
sslConfig.getSslKeyPath(); // quit if SSL_KEY_PATH is missing
sslConfig.getSslCertPath(); // quit if SSL_CERT_PATH is missing

const PORT = process.env.PORT || 3000; // 3000 if PORT is not set

app.listen(PORT, () => {
  console.log(`HustleHub+ listening on http://localhost:${PORT}`);
});
