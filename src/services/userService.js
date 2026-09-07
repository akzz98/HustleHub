const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10; // cost factor — 10 is the usual bcrypt default

function findByEmail(email) {
  return userRepository.findByEmail(email);
}

function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

function createUser(name, email, password) {
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
  };

  return userRepository.create(user);
}

module.exports = {
  findByEmail,
  hashPassword,
  createUser,
};
