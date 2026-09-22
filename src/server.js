require('dotenv').config(); // loads variables from .env

const https = require('https');
const app = require('./app');
const tokenService = require('./services/tokenService');
const sslConfig = require('./utils/sslConfig');
const { connectDatabase } = require('./config/db');

tokenService.getJwtSecret(); // quit if JWT_SECRET is missing

const { key, cert } = sslConfig.readSslMaterials();
const PORT = process.env.PORT || 3000; // 3000 if PORT is not set

async function start() {
  await connectDatabase(); // app.js does not open MongoDB

  https.createServer({ key, cert }, app).listen(PORT, () => {
    console.log(`HustleHub+ listening on https://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err.message); // generic message only — no URI or secrets
  process.exit(1);
});
