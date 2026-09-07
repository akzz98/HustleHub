const fs = require('fs');
const path = require('path');

const USERS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');

function findAll() {
  const fileContents = fs.readFileSync(USERS_FILE_PATH, 'utf8');
  return JSON.parse(fileContents);
}

module.exports = {
  USERS_FILE_PATH,
  findAll,
};
