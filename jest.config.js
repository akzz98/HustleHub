module.exports = {
  testEnvironment: 'node', // API tests, not a browser
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  passWithNoTests: true,
};
