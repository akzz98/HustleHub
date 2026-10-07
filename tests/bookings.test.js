const request = require('supertest');
const app = require('../src/app');

const freelancerUser = {
  name: 'Free Lancer',
  email: 'freelancer@example.com',
  password: 'SecurePassword123!',
  role: 'freelancer',
};

const clientUser = {
  name: 'Cli Ent',
  email: 'client@example.com',
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

async function createGigAsFreelancer() {
  const freelancer = await registerAndLogin(freelancerUser);

  const gig = await request(app)
    .post('/api/gigs')
    .set('Authorization', `Bearer ${freelancer.token}`)
    .send({
      title: 'Logo design',
      description: 'Simple logo package',
      price: 150,
    });

  return { freelancer, gig: gig.body };
}

describe('POST /api/bookings', () => {
  test('client can book an existing gig', async () => {
    const { freelancer, gig } = await createGigAsFreelancer();
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      gigId: gig.id,
      clientId: client.user.id,
      freelancerId: freelancer.user.id,
      status: 'confirmed',
      confirmation: {
        paymentSimulated: true,
        message: 'Booking confirmed. Payment was simulated — no real charge was made.',
      },
      transaction: {
        id: expect.any(String),
        bookingId: expect.any(String),
        clientId: client.user.id,
        freelancerId: freelancer.user.id,
        amount: 150,
      },
    });
    expect(response.body.transaction.bookingId).toBe(response.body.id);
  });

  test('booking confirmation is simulated without real payment fields', async () => {
    const { gig } = await createGigAsFreelancer();
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.id });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('confirmed');
    expect(response.body.confirmation.paymentSimulated).toBe(true);
    expect(response.body).not.toHaveProperty('cardNumber');
    expect(response.body).not.toHaveProperty('paymentToken');
    expect(JSON.stringify(response.body)).not.toMatch(/stripe|paypal|paymentIntent/i);
  });

  test('creates a transaction linked to client, freelancer, and gig price', async () => {
    const { freelancer, gig } = await createGigAsFreelancer();
    const client = await registerAndLogin(clientUser);
    const transactionRepository = require('../src/repositories/transactionRepository');

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.id });

    expect(response.status).toBe(201);

    const stored = await transactionRepository.findByBookingId(response.body.id);

    expect(stored).toEqual({
      id: response.body.transaction.id,
      bookingId: response.body.id,
      clientId: client.user.id,
      freelancerId: freelancer.user.id,
      amount: gig.price,
    });
  });

  test('ignores client-supplied transaction amount', async () => {
    const { gig } = await createGigAsFreelancer();
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: gig.id, amount: 1 });

    expect(response.status).toBe(201);
    expect(response.body.transaction.amount).toBe(150);
  });

  test('ignores client-supplied clientId and freelancerId', async () => {
    const { freelancer, gig } = await createGigAsFreelancer();
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({
        gigId: gig.id,
        clientId: freelancer.user.id,
        freelancerId: client.user.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.clientId).toBe(client.user.id);
    expect(response.body.freelancerId).toBe(freelancer.user.id);
  });

  test('freelancer role is forbidden', async () => {
    const { freelancer, gig } = await createGigAsFreelancer();

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${freelancer.token}`)
      .send({ gigId: gig.id });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is rejected', async () => {
    const { gig } = await createGigAsFreelancer();

    const response = await request(app).post('/api/bookings').send({ gigId: gig.id });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('unknown gig returns 404', async () => {
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: '64b64c4f2f1c2e0012345678' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Gig not found.' });
  });

  test('missing gigId is rejected', async () => {
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Gig id is required.');
  });
});

describe('GET /api/bookings', () => {
  test('client sees only their own bookings', async () => {
    const { freelancer, gig } = await createGigAsFreelancer();
    const clientA = await registerAndLogin(clientUser);
    const clientB = await registerAndLogin({
      ...clientUser,
      name: 'Other Client',
      email: 'client-b@example.com',
    });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientA.token}`)
      .send({ gigId: gig.id });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientB.token}`)
      .send({ gigId: gig.id });

    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${clientA.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].clientId).toBe(clientA.user.id);
    expect(response.body[0].freelancerId).toBe(freelancer.user.id);
    expect(response.body[0].confirmation).toBeUndefined();
    expect(response.body[0].transaction).toBeUndefined();
  });

  test('freelancer sees bookings on their own gigs only', async () => {
    const owner = await createGigAsFreelancer();
    const otherFreelancer = await registerAndLogin({
      ...freelancerUser,
      name: 'Other Free',
      email: 'other-free@example.com',
    });

    const otherGig = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${otherFreelancer.token}`)
      .send({
        title: 'Other gig',
        description: 'Not mine',
        price: 50,
      });

    const client = await registerAndLogin(clientUser);

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: owner.gig.id });

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`)
      .send({ gigId: otherGig.body.id });

    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${owner.freelancer.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].freelancerId).toBe(owner.freelancer.user.id);
    expect(response.body[0].gigId).toBe(owner.gig.id);
  });

  test('empty list when the user has no bookings', async () => {
    const client = await registerAndLogin(clientUser);

    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${client.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('missing token is rejected', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });
});
