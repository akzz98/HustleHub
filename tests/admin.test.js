const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/userService');
const tokenService = require('../src/services/tokenService');

const freelancerUser = {
  name: 'Free Lancer',
  email: 'admin-free@example.com',
  password: 'SecurePassword123!',
  role: 'freelancer',
};

const clientUser = {
  name: 'Cli Ent',
  email: 'admin-client@example.com',
  password: 'SecurePassword123!',
  role: 'client',
};

async function registerAndLogin(user) {
  const registered = await request(app).post('/api/auth/register').send(user);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  return { user: registered.body, token: login.body.token };
}

async function createAdminToken() {
  const admin = await userService.createAdminUser(
    'Local Admin',
    'admin-oversight@example.com',
    'AdminPassword123!'
  );
  const token = tokenService.createAccessToken(admin.id, admin.role);
  return { admin, token };
}

async function seedMarketplace() {
  const freelancer = await registerAndLogin(freelancerUser);
  const client = await registerAndLogin(clientUser);

  const gig = await request(app)
    .post('/api/gigs')
    .set('Authorization', `Bearer ${freelancer.token}`)
    .send({
      title: 'Admin view gig',
      description: 'For oversight',
      price: 90,
    });

  const booking = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${client.token}`)
    .send({ gigId: gig.body.id });

  return { freelancer, client, gig: gig.body, booking: booking.body };
}

describe('GET /api/admin/* read-only oversight', () => {
  test('admin can list and view users without password hashes', async () => {
    const { admin, token } = await createAdminToken();
    await registerAndLogin(clientUser);

    const list = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(2);
    expect(list.body.every((user) => user.passwordHash === undefined)).toBe(true);
    expect(list.body.every((user) => user.password === undefined)).toBe(true);
    expect(JSON.stringify(list.body)).not.toContain('passwordHash');

    const viewed = await request(app)
      .get(`/api/admin/users/${admin.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(viewed.status).toBe(200);
    expect(viewed.body).toEqual({
      id: admin.id,
      name: 'Local Admin',
      email: 'admin-oversight@example.com',
      role: 'admin',
    });
  });

  test('admin can list and view gigs, bookings, and transactions', async () => {
    const { token } = await createAdminToken();
    const seeded = await seedMarketplace();

    const gigs = await request(app)
      .get('/api/admin/gigs')
      .set('Authorization', `Bearer ${token}`);
    const gig = await request(app)
      .get(`/api/admin/gigs/${seeded.gig.id}`)
      .set('Authorization', `Bearer ${token}`);

    const bookings = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${token}`);
    const booking = await request(app)
      .get(`/api/admin/bookings/${seeded.booking.id}`)
      .set('Authorization', `Bearer ${token}`);

    const transactions = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${token}`);
    const transaction = await request(app)
      .get(`/api/admin/transactions/${seeded.booking.transaction.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(gigs.status).toBe(200);
    expect(gigs.body.some((item) => item.id === seeded.gig.id)).toBe(true);
    expect(gig.status).toBe(200);
    expect(gig.body.id).toBe(seeded.gig.id);

    expect(bookings.status).toBe(200);
    expect(bookings.body.some((item) => item.id === seeded.booking.id)).toBe(true);
    expect(booking.status).toBe(200);
    expect(booking.body.id).toBe(seeded.booking.id);

    expect(transactions.status).toBe(200);
    expect(transactions.body.some((item) => item.id === seeded.booking.transaction.id)).toBe(true);
    expect(transaction.status).toBe(200);
    expect(transaction.body).toEqual({
      id: seeded.booking.transaction.id,
      bookingId: seeded.booking.id,
      clientId: seeded.client.user.id,
      freelancerId: seeded.freelancer.user.id,
      amount: 90,
    });
  });

  test('unknown resources return 404', async () => {
    const { token } = await createAdminToken();
    const missingId = '64b64c4f2f1c2e0012345678';

    const user = await request(app)
      .get(`/api/admin/users/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    const gig = await request(app)
      .get(`/api/admin/gigs/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    const booking = await request(app)
      .get(`/api/admin/bookings/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    const transaction = await request(app)
      .get(`/api/admin/transactions/${missingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(user.status).toBe(404);
    expect(gig.status).toBe(404);
    expect(booking.status).toBe(404);
    expect(transaction.status).toBe(404);
  });

  test('client and freelancer are forbidden on admin routes', async () => {
    const client = await registerAndLogin(clientUser);
    const freelancer = await registerAndLogin(freelancerUser);

    for (const token of [client.token, freelancer.token]) {
      const users = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      const gigs = await request(app)
        .get('/api/admin/gigs')
        .set('Authorization', `Bearer ${token}`);
      const bookings = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${token}`);
      const transactions = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(users.status).toBe(403);
      expect(gigs.status).toBe(403);
      expect(bookings.status).toBe(403);
      expect(transactions.status).toBe(403);
    }
  });

  test('unauthenticated requests are rejected', async () => {
    const response = await request(app).get('/api/admin/users');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('admin write methods are not available', async () => {
    const { token } = await createAdminToken();

    const postUsers = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nope' });
    const putGigs = await request(app)
      .put('/api/admin/gigs/64b64c4f2f1c2e0012345678')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope' });
    const deleteBookings = await request(app)
      .delete('/api/admin/bookings/64b64c4f2f1c2e0012345678')
      .set('Authorization', `Bearer ${token}`);
    const patchTransactions = await request(app)
      .patch('/api/admin/transactions/64b64c4f2f1c2e0012345678')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1 });

    // Express returns 404 when no matching write route is registered.
    expect(postUsers.status).toBe(404);
    expect(putGigs.status).toBe(404);
    expect(deleteBookings.status).toBe(404);
    expect(patchTransactions.status).toBe(404);
  });
});
