const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/userService');
const tokenService = require('../src/services/tokenService');

/**
 * STEP 7.5 — single happy-path walk across all public/API surfaces after
 * Helmet, rate limits, and extended sanitisation. Detailed edge cases stay
 * in the feature suites; this catches wiring regressions.
 */
describe('Part 2 endpoint regression', () => {
  test('core marketplace + admin + security headers still function', async () => {
    const health = await request(app).get('/');
    expect(health.status).toBe(200);
    expect(health.headers['content-security-policy']).toContain("default-src 'self'");

    const freelancerCreds = {
      name: 'Reg Freelancer',
      email: 'reg-freelancer@example.com',
      password: 'SecurePassword123!',
      role: 'freelancer',
    };
    const clientCreds = {
      name: 'Reg Client',
      email: 'reg-client@example.com',
      password: 'SecurePassword123!',
      role: 'client',
    };

    const freelancerReg = await request(app).post('/api/auth/register').send(freelancerCreds);
    expect(freelancerReg.status).toBe(201);

    const clientReg = await request(app).post('/api/auth/register').send(clientCreds);
    expect(clientReg.status).toBe(201);

    const freelancerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: freelancerCreds.email, password: freelancerCreds.password });
    expect(freelancerLogin.status).toBe(200);
    expect(freelancerLogin.body.token).toBeDefined();

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: clientCreds.email, password: clientCreds.password });
    expect(clientLogin.status).toBe(200);
    expect(clientLogin.body.token).toBeDefined();

    const freelancerToken = freelancerLogin.body.token;
    const clientToken = clientLogin.body.token;

    const profile = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe(clientCreds.email);

    const createdGig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Regression gig',
        description: 'End-to-end check',
        price: 150,
      });
    expect(createdGig.status).toBe(201);
    const gigId = createdGig.body.id;

    const listGigs = await request(app).get('/api/gigs');
    expect(listGigs.status).toBe(200);
    expect(listGigs.body.some((gig) => gig.id === gigId)).toBe(true);

    const getGig = await request(app).get(`/api/gigs/${gigId}`);
    expect(getGig.status).toBe(200);
    expect(getGig.body.title).toBe('Regression gig');

    const updatedGig = await request(app)
      .put(`/api/gigs/${gigId}`)
      .set('Authorization', `Bearer ${freelancerToken}`)
      .send({
        title: 'Regression gig updated',
        description: 'End-to-end check',
        price: 160,
      });
    expect(updatedGig.status).toBe(200);
    expect(updatedGig.body.price).toBe(160);

    const booking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ gigId });
    expect(booking.status).toBe(201);
    expect(booking.body.transaction).toBeDefined();
    const bookingId = booking.body.id;
    const transactionId = booking.body.transaction.id;

    const clientBookings = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(clientBookings.status).toBe(200);
    expect(clientBookings.body.some((item) => item.id === bookingId)).toBe(true);

    const freelancerBookings = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(freelancerBookings.status).toBe(200);
    expect(freelancerBookings.body.some((item) => item.id === bookingId)).toBe(true);

    const income = await request(app)
      .get('/api/income/me')
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(income.status).toBe(200);
    expect(income.body.totalIncome).toBe(160);

    const admin = await userService.createAdminUser(
      'Reg Admin',
      'reg-admin@example.com',
      'AdminPassword123!'
    );
    const adminToken = tokenService.createAccessToken(admin.id, admin.role);

    const adminUsers = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminUsers.status).toBe(200);
    expect(adminUsers.body.length).toBeGreaterThanOrEqual(3);

    const adminGigs = await request(app)
      .get('/api/admin/gigs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminGigs.status).toBe(200);

    const adminBookings = await request(app)
      .get(`/api/admin/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminBookings.status).toBe(200);

    const adminTransactions = await request(app)
      .get(`/api/admin/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminTransactions.status).toBe(200);
    expect(adminTransactions.body.amount).toBe(160);

    const forbidden = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(forbidden.status).toBe(403);

    const unauthenticated = await request(app).get('/api/bookings');
    expect(unauthenticated.status).toBe(401);

    const deleted = await request(app)
      .delete(`/api/gigs/${gigId}`)
      .set('Authorization', `Bearer ${freelancerToken}`);
    expect(deleted.status).toBe(204);
  });
});
