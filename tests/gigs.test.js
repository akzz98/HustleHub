const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/userService');
const gigRepository = require('../src/repositories/gigRepository');

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

const validGig = {
  title: 'Logo design',
  description: 'Simple logo package',
  price: 150,
};

async function registerAndLogin(user) {
  const registered = await request(app).post('/api/auth/register').send(user);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  return { user: registered.body, token: login.body.token };
}

describe('GET /api/gigs', () => {
  test('returns an empty list when there are no gigs', async () => {
    const response = await request(app).get('/api/gigs');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('lists gigs without authentication', async () => {
    const freelancer = await userService.createUser(
      freelancerUser.name,
      freelancerUser.email,
      freelancerUser.password,
      freelancerUser.role
    );

    await gigRepository.create({
      title: validGig.title,
      description: validGig.description,
      price: validGig.price,
      freelancerId: freelancer.id,
    });

    const response = await request(app).get('/api/gigs');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: expect.any(String),
        title: 'Logo design',
        description: 'Simple logo package',
        price: 150,
        freelancerId: freelancer.id,
      },
    ]);
  });

  test('public gig payload does not expose password fields', async () => {
    const freelancer = await userService.createUser(
      'Free Lancer',
      'freelancer2@example.com',
      'SecurePassword123!',
      'freelancer'
    );

    await gigRepository.create({
      title: 'Website fix',
      description: 'Bug fix session',
      price: 80,
      freelancerId: freelancer.id,
    });

    const response = await request(app).get('/api/gigs');
    const text = JSON.stringify(response.body);

    expect(response.status).toBe(200);
    expect(text).not.toContain('password');
    expect(text).not.toContain('passwordHash');
  });
});

describe('POST /api/gigs', () => {
  test('freelancer can create a gig', async () => {
    const { user, token } = await registerAndLogin(freelancerUser);

    const response = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      title: 'Logo design',
      description: 'Simple logo package',
      price: 150,
      freelancerId: user.id,
    });
  });

  test('created gig appears in the public list', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const list = await request(app).get('/api/gigs');

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Logo design');
  });

  test('ignores client-supplied freelancerId and uses the JWT user', async () => {
    const { user, token } = await registerAndLogin(freelancerUser);
    const otherFreelancer = await userService.createUser(
      'Other Free',
      'other@example.com',
      'SecurePassword123!',
      'freelancer'
    );

    const response = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validGig, freelancerId: otherFreelancer.id });

    expect(response.status).toBe(201);
    expect(response.body.freelancerId).toBe(user.id);
    expect(response.body.freelancerId).not.toBe(otherFreelancer.id);
  });

  test('client role is forbidden', async () => {
    const { token } = await registerAndLogin(clientUser);

    const response = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is rejected', async () => {
    const response = await request(app).post('/api/gigs').send(validGig);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('invalid body is rejected', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const response = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Title, description and price are required.');
  });
});

describe('GET /api/gigs/:id', () => {
  test('returns a single gig without authentication', async () => {
    const { user, token } = await registerAndLogin(freelancerUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const response = await request(app).get(`/api/gigs/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      title: 'Logo design',
      description: 'Simple logo package',
      price: 150,
      freelancerId: user.id,
    });
  });

  test('unknown id returns 404', async () => {
    const response = await request(app).get('/api/gigs/64b64c4f2f1c2e0012345678');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Gig not found.' });
  });

  test('invalid id format returns 404', async () => {
    const response = await request(app).get('/api/gigs/not-a-valid-id');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Gig not found.' });
  });
});

describe('PUT /api/gigs/:id', () => {
  const updatedGig = {
    title: 'Logo redesign',
    description: 'Updated logo package',
    price: 200,
  };

  test('owner can update their gig', async () => {
    const { user, token } = await registerAndLogin(freelancerUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const response = await request(app)
      .put(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedGig);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: created.body.id,
      title: 'Logo redesign',
      description: 'Updated logo package',
      price: 200,
      freelancerId: user.id,
    });
  });

  test('another freelancer cannot update the gig', async () => {
    const owner = await registerAndLogin(freelancerUser);
    const other = await registerAndLogin({
      ...freelancerUser,
      name: 'Other Free',
      email: 'other-freelancer@example.com',
    });

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(validGig);

    const response = await request(app)
      .put(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send(updatedGig);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('client role is forbidden', async () => {
    const owner = await registerAndLogin(freelancerUser);
    const client = await registerAndLogin(clientUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(validGig);

    const response = await request(app)
      .put(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${client.token}`)
      .send(updatedGig);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is rejected', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const response = await request(app)
      .put(`/api/gigs/${created.body.id}`)
      .send(updatedGig);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('unknown gig returns 404', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const response = await request(app)
      .put('/api/gigs/64b64c4f2f1c2e0012345678')
      .set('Authorization', `Bearer ${token}`)
      .send(updatedGig);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Gig not found.' });
  });
});

describe('DELETE /api/gigs/:id', () => {
  test('owner can delete their gig', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const response = await request(app)
      .delete(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    const missing = await request(app).get(`/api/gigs/${created.body.id}`);
    expect(missing.status).toBe(404);
  });

  test('another freelancer cannot delete the gig', async () => {
    const owner = await registerAndLogin(freelancerUser);
    const other = await registerAndLogin({
      ...freelancerUser,
      name: 'Other Free',
      email: 'other-delete@example.com',
    });

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(validGig);

    const response = await request(app)
      .delete(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });

    const stillThere = await request(app).get(`/api/gigs/${created.body.id}`);
    expect(stillThere.status).toBe(200);
  });

  test('client role is forbidden', async () => {
    const owner = await registerAndLogin(freelancerUser);
    const client = await registerAndLogin(clientUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(validGig);

    const response = await request(app)
      .delete(`/api/gigs/${created.body.id}`)
      .set('Authorization', `Bearer ${client.token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden.' });
  });

  test('missing token is rejected', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const created = await request(app)
      .post('/api/gigs')
      .set('Authorization', `Bearer ${token}`)
      .send(validGig);

    const response = await request(app).delete(`/api/gigs/${created.body.id}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required.' });
  });

  test('unknown gig returns 404', async () => {
    const { token } = await registerAndLogin(freelancerUser);

    const response = await request(app)
      .delete('/api/gigs/64b64c4f2f1c2e0012345678')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Gig not found.' });
  });
});
