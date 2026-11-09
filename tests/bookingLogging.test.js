const request = require('supertest');
const app = require('../src/app');
const { logger } = require('../src/utils/logger');

describe('booking and transaction event logging', () => {
  let infoSpy;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  async function registerAndLogin(user) {
    const registered = await request(app).post('/api/auth/register').send(user);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    return { user: registered.body, token: login.body.token };
  }

  function payloadsFor(eventName) {
    return infoSpy.mock.calls
      .map(([payload]) => payload)
      .filter((payload) => payload && payload.event === eventName);
  }

  test('logs booking_created and transaction_created with ids and amount only', async () => {
    const freelancer = await registerAndLogin({
      name: 'Log Freelancer',
      email: 'booking-log-freelancer@example.com',
      password: 'SecurePassword123!',
      role: 'freelancer',
    });
    const client = await registerAndLogin({
      name: 'Log Client',
      email: 'booking-log-client@example.com',
      password: 'SecurePassword123!',
      role: 'client',
    });

    const gig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({
        title: 'Logged gig',
        description: 'For booking logs',
        price: 175,
      });

    infoSpy.mockClear();

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.body.id });

    expect(response.status).toBe(201);

    expect(payloadsFor('booking_created')).toEqual([
      {
        event: 'booking_created',
        bookingId: response.body.id,
        gigId: gig.body.id,
        clientId: client.user.id,
        freelancerId: freelancer.user.id,
      },
    ]);

    expect(payloadsFor('transaction_created')).toEqual([
      {
        event: 'transaction_created',
        transactionId: response.body.transaction.id,
        bookingId: response.body.id,
        clientId: client.user.id,
        freelancerId: freelancer.user.id,
        amount: 175,
      },
    ]);

    const bookingLog = payloadsFor('booking_created')[0];
    const transactionLog = payloadsFor('transaction_created')[0];
    expect(bookingLog.password).toBeUndefined();
    expect(bookingLog.token).toBeUndefined();
    expect(transactionLog.password).toBeUndefined();
    expect(transactionLog.token).toBeUndefined();
  });
});
