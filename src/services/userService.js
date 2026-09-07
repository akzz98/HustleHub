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

function comparePassword(plainPassword, passwordHash) {
  // true if the plaintext matches the stored hash
  return bcrypt.compareSync(plainPassword, passwordHash);
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

function toPublicUser(user) {
  // id, name, email only
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

module.exports = {
  findByEmail,
  hashPassword,
  comparePassword,
  createUser,
  toPublicUser,
};
