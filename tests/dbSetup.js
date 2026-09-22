const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/db');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
