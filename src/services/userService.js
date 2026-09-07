const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10; // cost factor — 10 is the usual bcrypt default

function findByEmail(email) {
  return userRepository.findByEmail(email);
}

function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
}

module.exports = {
  findByEmail,
  hashPassword,
};
