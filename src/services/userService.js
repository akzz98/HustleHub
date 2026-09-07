const userRepository = require('../repositories/userRepository');

function findByEmail(email) {
  return userRepository.findByEmail(email);
}

module.exports = {
  findByEmail,
};
