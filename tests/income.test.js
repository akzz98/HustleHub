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
