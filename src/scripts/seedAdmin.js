require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase } = require('../config/db');
const userService = require('../services/userService');
const { prepareAdminSeedCredentials } = require('../utils/validation');

async function seedAdmin({
  nodeEnv = process.env.NODE_ENV,
  name = process.env.ADMIN_SEED_NAME,
  email = process.env.ADMIN_SEED_EMAIL,
  password = process.env.ADMIN_SEED_PASSWORD,
} = {}) {
  // Hard gate: never seed elevated accounts outside local development.
  if (nodeEnv !== 'development') {
    throw new Error('Admin seeding is only allowed when NODE_ENV=development.');
  }

  const prepared = prepareAdminSeedCredentials({ name, email, password });

  if (prepared.error) {
    throw new Error(prepared.error);
  }

  const sanitised = prepared.value;
  const existing = await userService.findByEmail(sanitised.email);

  if (existing) {
    if (existing.role === 'admin') {
      return { created: false, email: existing.email, reason: 'already_exists' };
    }

    // Do not silently elevate a client/freelancer account.
    throw new Error('An account with this email already exists.');
  }

  const admin = await userService.createAdminUser(
    sanitised.name,
    sanitised.email,
    sanitised.password
  );

  return { created: true, email: admin.email, id: admin.id };
}

async function runCli() {
  try {
    await connectDatabase();
    const result = await seedAdmin();

    if (result.created) {
      console.log(`Admin user created for ${result.email}.`);
    } else {
      console.log(`Admin user already exists for ${result.email}.`);
    }

    process.exitCode = 0;
  } catch (err) {
    console.error(err.message); // no password or stack dump
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  seedAdmin,
};
