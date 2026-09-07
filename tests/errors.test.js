const fs = require('fs');
const request = require('supertest');
const app = require('../src/app'); // Express app, not the HTTPS server
const { USERS_FILE_PATH } = require('../src/repositories/userRepository');

function removeUsersFile() {
  if (fs.existsSync(USERS_FILE_PATH)) {
    fs.unlinkSync(USERS_FILE_PATH); // wipe generated test data
  }
}

function assertNoLeaks(body) {
  // Client JSON must not include stacks, file paths, or secrets
  const text = JSON.stringify(body);

  expect(body.stack).toBeUndefined();
  expect(text).not.toMatch(/stack/i);
  expect(text).not.toContain('SyntaxError');
  expect(text).not.toContain('Unexpected token');
  expect(text).not.toContain('node_modules');
  expect(text).not.toContain('JWT_SECRET');
  expect(text).not.toContain(process.env.JWT_SECRET);
  expect(text).not.toContain('passwordHash');
  expect(text).not.toMatch(/src[\\/]/);
  expect(text).not.toMatch(/[A-Za-z]:\\/); // Windows path such as C:\
}

beforeEach(removeUsersFile);
afterEach(removeUsersFile);

describe('error responses', () => {
  test('malformed JSON returns 400 and does not leak parser details', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{not-json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid JSON in request body.' });
    assertNoLeaks(response.body);
  });

  test('validation errors return only an error message', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
    expect(Object.keys(response.body)).toEqual(['error']);
    assertNoLeaks(response.body);
  });

  test('unexpected errors return a generic 500 and log the real error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fs.writeFileSync(USERS_FILE_PATH, '{'); // not valid JSON — findAll will throw

    try {
      const response = await request(app).post('/api/auth/register').send({
        name: 'John Smith',
        email: 'john@example.com',
        password: 'SecurePassword123!',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An internal server error occurred.' });
      expect(spy).toHaveBeenCalled();
      assertNoLeaks(response.body);
    } finally {
      spy.mockRestore();
    }
  });
});
