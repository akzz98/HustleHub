const os = require('os');
const mongoose = require('mongoose');

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  // No hard-coded fallback — the process should not connect without this.
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  return uri;
}

async function connectDatabase() {
  const uri = getMongoUri();

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // MongoDB driver 7 loads `os` via import(); Jest's VM rejects that and
      // then sends handshake metadata without the required `driver` field.
      runtimeAdapters: { os },
    });
  } catch (err) {
    // Do not include the URI (it may contain credentials) in the thrown message.
    throw new Error('Failed to connect to the database.');
  }
}

module.exports = {
  getMongoUri,
  connectDatabase,
};
