const express = require('express');
const request = require('supertest');
const { authenticate } = require('../src/middleware/authenticate');
const { requireRole } = require('../src/middleware/requireRole');
const app = require('../src/app');

function createMockResponse() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('requireRole middleware (unit)', () => {
  test('matching role calls next', () => {
    const middleware = requireRole('freelancer');
    const req = { userRole: 'freelancer' };
    const res = createMockResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  test('wrong role returns 403 Forbidden', () => {
    const middleware = requireRole('freelancer');
    const req = { userRole: 'client' };
    const res = createMockResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing role returns 403 Forbidden', () => {
    const middleware = requireRole('freelancer');
    const req = {};
    const res = createMockResponse();
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden.' });
  });

  test('allows any of multiple listed roles', () => {
    const middleware = requireRole('client', 'admin');
    const res = createMockResponse();
    let nextCalled = false;

    middleware({ userRole: 'admin' }, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
  });
});

describe('authenticate + requireRole (integration)', () => {
  // Temporary route for this suite only — not part of the production app.
  const protectedApp = express();
  protectedApp.get(
    '/test/freelancer-only',
    authenticate,
    requireRole('freelancer'),
    (req, res) => {
      res.status(200).json({ ok: true, userId: req.userId, userRole: req.userRole });
    }
  );

  const freelancer = {
    name: 'Free Lancer',
    email: 'freelancer@example.com',
    password: 'SecurePassword123!',
    role: 'freelancer',
  };

  const client = {
    name: 'Cli Ent',
    email: 'client@example.com',
    password: 'SecurePassword123!',
    role: 'client',
  };

  async function registerAndLogin(user) {
    await request(app).post('/api/auth/register').send(user);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    return login.body.token;
  }

  test('freelancer token is allowed', async () => {
    const token = await registerAndLogin(freelancer);

    const response = await request(protectedApp)
      .get('/test/freelancer-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.userRole).toBe('freelancer');
    expect(response.body.userId).toEqual(expect.any(String));
  });

  test('client token is forbidden', async () => {
    const token = await registerAndLogin(client);

    const response = await request(protectedApp)
      .get('/test/freelancer-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is still 401 from authenticate', async () => {
    const response = await request(protectedApp).get('/test/freelancer-only');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('invalid token is still 401 from authenticate', async () => {
    const response = await request(protectedApp)
      .get('/test/freelancer-only')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid or expired token.' });
  });
});
