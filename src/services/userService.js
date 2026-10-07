const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10; // cost factor — 10 is the usual bcrypt default

function findByEmail(email) {
  return userRepository.findByEmail(email);
}

function findById(id) {
  return userRepository.findById(id);
}

function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

function comparePassword(plainPassword, passwordHash) {
  // true if the plaintext matches the stored hash
  return bcrypt.compareSync(plainPassword, passwordHash);
}

function createUser(name, email, password, role) {
  return userRepository.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: role.trim(), // already validated as client or freelancer
  });
}

function toPublicUser(user) {
  // id, name, email only — role is not part of the Part 1 response shape
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

module.exports = {
  findByEmail,
  findById,
  hashPassword,
  comparePassword,
  createUser,
  toPublicUser,
};
