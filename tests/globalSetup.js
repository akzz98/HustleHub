const fs = require('fs');
const os = require('os');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

const URI_FILE = path.join(os.tmpdir(), 'hustlehub-mongo-test-uri');

module.exports = async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1' },
    binary: { version: '7.0.14' }, // MongoDB 8.2 handshake rejects Jest's driver metadata
  });

  global.__MONGO_MEMORY_SERVER__ = mongoServer;

  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  fs.writeFileSync(URI_FILE, uri, 'utf8');
};
