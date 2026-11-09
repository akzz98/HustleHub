const request = require('supertest');
const app = require('../src/app');
const {
  createCorsMiddleware,
  assertCorsConfigured,
} = require('../src/middleware/corsAllowlist');

describe('CORS allowlist', () => {
  const previousOrigin = process.env.CLIENT_ORIGIN;

  afterEach(() => {
    if (previousOrigin === undefined) {
      delete process.env.CLIENT_ORIGIN;
    } else {
      process.env.CLIENT_ORIGIN = previousOrigin;
    }
  });

  test('allowed Origin reaches the route and receives CORS headers', async () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    );
  });

  test('disallowed Origin is rejected', async () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    const response = await request(app)
      .get('/')
      .set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Origin not allowed.' });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('requests with no Origin still reach existing routes', async () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('OPTIONS preflight succeeds for the allowed Origin', async () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    const response = await request(app)
      .options('/api/gigs')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    );
    expect(response.headers['access-control-allow-methods']).toContain('GET');
  });

  test('missing CLIENT_ORIGIN fails closed outside the test environment', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    delete process.env.CLIENT_ORIGIN;
    process.env.NODE_ENV = 'development';

    expect(() => assertCorsConfigured()).toThrow(/CLIENT_ORIGIN must be set/);
    expect(() => createCorsMiddleware()).toThrow(/CLIENT_ORIGIN must be set/);

    process.env.NODE_ENV = previousNodeEnv;
  });
});
