const fs = require('fs');
const path = require('path');

// Keep the path in one place so we don't hard-code it in every function.
const USERS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'users.json');

function findAll() {
  // Throws if the file isn't there yet.
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
