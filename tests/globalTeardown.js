const fs = require('fs');
const os = require('os');
const path = require('path');

const URI_FILE = path.join(os.tmpdir(), 'hustlehub-mongo-test-uri');

module.exports = async function globalTeardown() {
  const mongoServer = global.__MONGO_MEMORY_SERVER__;

  if (mongoServer) {
    await mongoServer.stop();
  }

  if (fs.existsSync(URI_FILE)) {
    fs.unlinkSync(URI_FILE);
  }
};
