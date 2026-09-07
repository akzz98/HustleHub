const fs = require('fs');
const path = require('path');

const USERS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');

function ensureUsersFile() {
  // Create users.json with an empty list if the file is missing.
  if (!fs.existsSync(USERS_FILE_PATH)) {
    saveAll([]);
  }
}

function findAll() {
  ensureUsersFile();
  const fileContents = fs.readFileSync(USERS_FILE_PATH, 'utf8');
  return JSON.parse(fileContents); // user list
}

function saveAll(users) {
  const json = JSON.stringify(users, null, 2); // indented JSON
  fs.writeFileSync(USERS_FILE_PATH, json, 'utf8');
}

module.exports = {
  USERS_FILE_PATH,
  findAll,
  saveAll,
};
