const express = require('express');
const request = require('supertest');
const { createAuthRateLimiter } = require('../src/middleware/rateLimiters');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildLimitedAuthApp(max) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRateLimiter({ max, windowMs: 60 * 1000 }));
  app.post('/api/auth/login', (req, res) => {
    res.status(200).json({ ok: true });
  });
  app.post('/api/auth/register', (req, res) => {
    res.status(201).json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('Auth rate limiting', () => {
  test('returns 429 after the auth limit is exceeded', async () => {
    const app = buildLimitedAuthApp(3);

    for (let i = 0; i < 3; i += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@example.com', password: 'x' });
      expect(response.status).toBe(200);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'x' });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many requests, please try again later.',
    });
  });

  test('register and login share the same auth rate-limit bucket', async () => {
    const app = buildLimitedAuthApp(2);

    await request(app).post('/api/auth/register').send({}).expect(201);
    await request(app).post('/api/auth/login').send({}).expect(200);

    const blocked = await request(app).post('/api/auth/login').send({});
    expect(blocked.status).toBe(429);
  });
});
