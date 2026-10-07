const express = require('express');
const request = require('supertest');
const { createBookingRateLimiter } = require('../src/middleware/rateLimiters');
const { errorHandler } = require('../src/middleware/errorHandler');

function buildLimitedBookingApp(max) {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', createBookingRateLimiter({ max, windowMs: 60 * 1000 }));
  app.post('/api/bookings', (req, res) => {
    res.status(201).json({ ok: true });
  });
  app.get('/api/bookings', (req, res) => {
    res.status(200).json([]);
  });
  app.use(errorHandler);
  return app;
}

describe('Booking rate limiting', () => {
  test('returns 429 after the booking limit is exceeded', async () => {
    const app = buildLimitedBookingApp(3);

    for (let i = 0; i < 3; i += 1) {
      const response = await request(app).post('/api/bookings').send({});
      expect(response.status).toBe(201);
    }

    const blocked = await request(app).post('/api/bookings').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many requests, please try again later.',
    });
  });

  test('create and list share the same booking rate-limit bucket', async () => {
    const app = buildLimitedBookingApp(2);

    await request(app).post('/api/bookings').send({}).expect(201);
    await request(app).get('/api/bookings').expect(200);

    const blocked = await request(app).post('/api/bookings').send({});
    expect(blocked.status).toBe(429);
  });
});
