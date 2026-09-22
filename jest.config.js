module.exports = {
  testEnvironment: 'node', // API tests, not a browser
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/dbSetup.js'],
  testTimeout: 30000,
  maxWorkers: 1, // one mongoose connection; avoids parallel DB races
  passWithNoTests: true,
};
