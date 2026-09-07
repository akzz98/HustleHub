require('dotenv').config(); // loads variables from .env

const https = require('https');
const app = require('./app');
const tokenService = require('./services/tokenService');
const sslConfig = require('./utils/sslConfig');

tokenService.getJwtSecret(); // quit if JWT_SECRET is missing

const { key, cert } = sslConfig.readSslMaterials();
const PORT = process.env.PORT || 3000; // 3000 if PORT is not set

https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`HustleHub+ listening on https://localhost:${PORT}`);
});
