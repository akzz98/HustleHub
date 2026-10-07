const request = require('supertest');
const app = require('../src/app');
const incomeService = require('../src/services/incomeService');

const freelancerUser = {
  name: 'Free Lancer',
  email: 'income-freelancer@example.com',
  password: 'SecurePassword123!',
  role: 'freelancer',
};

const otherFreelancerUser = {
  name: 'Other Free',
  email: 'income-other@example.com',
  password: 'SecurePassword123!',
  role: 'freelancer',
};

const clientUser = {
  name: 'Cli Ent',
  email: 'income-client@example.com',
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

describe('incomeService.getFreelancerIncome', () => {
  test('returns zero income when the freelancer has no transactions', async () => {
    const freelancer = await registerAndLogin(freelancerUser);

    const income = await incomeService.getFreelancerIncome(freelancer.user.id);

    expect(income).toEqual({
      freelancerId: freelancer.user.id,
      totalIncome: 0,
      transactionCount: 0,
    });
  });

  test('sums transaction amounts for the freelancer only', async () => {
    const freelancer = await registerAndLogin(freelancerUser);
    const other = await registerAndLogin(otherFreelancerUser);
    const client = await registerAndLogin(clientUser);

    const gigA = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ title: 'Gig A', description: 'First', price: 100 });

    const gigB = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ title: 'Gig B', description: 'Second', price: 50 });

    const otherGig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Other', description: 'Not mine', price: 999 });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gigA.body.id });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gigB.body.id });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: otherGig.body.id });

    const income = await incomeService.getFreelancerIncome(freelancer.user.id);
    const otherIncome = await incomeService.getFreelancerIncome(other.user.id);

    expect(income).toEqual({
      freelancerId: freelancer.user.id,
      totalIncome: 150,
      transactionCount: 2,
    });

    expect(otherIncome).toEqual({
      freelancerId: other.user.id,
      totalIncome: 999,
      transactionCount: 1,
    });
  });

  test('invalid freelancer id returns zero income', async () => {
    const income = await incomeService.getFreelancerIncome('not-a-valid-id');

    expect(income).toEqual({
      freelancerId: 'not-a-valid-id',
      totalIncome: 0,
      transactionCount: 0,
    });
  });
});

describe('GET /api/income/me', () => {
  test('freelancer can view their own income', async () => {
    const freelancer = await registerAndLogin(freelancerUser);
    const client = await registerAndLogin(clientUser);

    const gig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ title: 'Paid gig', description: 'Work done', price: 120 });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.body.id });

    const response = await request(app)
      .get('/api/income/me')
      .set('Authorization', `Bearer ${freelancer.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      freelancerId: freelancer.user.id,
      totalIncome: 120,
      transactionCount: 1,
    });
  });

  test('ignores client-supplied freelancerId query or body', async () => {
    const freelancer = await registerAndLogin(freelancerUser);
    const other = await registerAndLogin(otherFreelancerUser);
    const client = await registerAndLogin(clientUser);

    const otherGig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Other', description: 'Not mine', price: 500 });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: otherGig.body.id });

    const response = await request(app)
      .get(`/api/income/me?freelancerId=${other.user.id}`)
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ freelancerId: other.user.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      freelancerId: freelancer.user.id,
      totalIncome: 0,
      transactionCount: 0,
    });
  });

  test('client role is forbidden', async () => {
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .get('/api/income/me')
      .set('Authorization', `Bearer ${client.token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is rejected', async () => {
    const response = await request(app).get('/api/income/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });
});
