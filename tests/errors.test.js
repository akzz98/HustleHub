const request = require('supertest');
const app = require('../src/app'); // Express app, not the HTTPS server
const userService = require('../src/services/userService');
const { logger } = require('../src/utils/logger');

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
    const logSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const findSpy = jest
      .spyOn(userService, 'findByEmail')
      .mockRejectedValue(new Error('simulated storage failure'));

    try {
      const response = await request(app).post('/api/auth/register').send({
        name: 'John Smith',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        role: 'client',
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An internal server error occurred.' });
      assertNoLeaks(response.body);

      expect(logSpy).toHaveBeenCalled();
      const [payload] = logSpy.mock.calls[0];
      expect(payload).toEqual(
        expect.objectContaining({
          event: 'server_error',
          errName: 'Error',
          errMessage: 'simulated storage failure',
          method: 'POST',
          path: '/api/auth/register',
        })
      );
      expect(payload.stack).toBeUndefined();
      expect(payload.password).toBeUndefined();
      expect(payload.token).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain('simulated storage failure');
    } finally {
      findSpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});

