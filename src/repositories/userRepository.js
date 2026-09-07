const fs = require('fs');
const path = require('path');

// Keep the path in one place so we don't hard-code it in every function.
const USERS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');

function ensureUsersFile() {
  // Fresh clone / first run won't have users.json, and we don't commit that file.
  if (!fs.existsSync(USERS_FILE_PATH)) {
    saveAll([]);
  }
}

function findAll() {
  ensureUsersFile();
  const fileContents = fs.readFileSync(USERS_FILE_PATH, 'utf8');
  return JSON.parse(fileContents);
}

function saveAll(users) {
  // Pretty-print so it's easier to inspect the file while we're testing.
  const json = JSON.stringify(users, null, 2);
  fs.writeFileSync(USERS_FILE_PATH, json, 'utf8');
}

module.exports = {
  USERS_FILE_PATH,
  findAll,
  saveAll,
};
