const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app'); // Express app, not the HTTPS server
const userRepository = require('../src/repositories/userRepository');

const validUser = {
  name: 'John Smith',
  email: 'john@example.com',
  password: 'SecurePassword123!',
  role: 'client',
};

describe('POST /api/auth/register', () => {
  test('valid registration returns 201 and public fields only', async () => {
    const response = await request(app).post('/api/auth/register').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'John Smith',
      email: 'john@example.com',
    });
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
  });

  test('missing fields are rejected', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('invalid email is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email address.');
  });

  test('invalid password is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'password' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Password must be/);
  });

  test('name longer than 100 characters is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, name: 'A'.repeat(101) });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name must be at most 100 characters.');
  });

  test('duplicate email is rejected', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const response = await request(app).post('/api/auth/register').send(validUser);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('An account with this email already exists.');
  });

  test('stored password is hashed and plaintext is not kept', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const stored = await userRepository.findByEmail(validUser.email);

    expect(stored.password).toBeUndefined();
    expect(stored.passwordHash).toMatch(/^\$2[aby]?\$/); // bcrypt hash prefix
    expect(JSON.stringify(stored)).not.toContain(validUser.password);
    expect(bcrypt.compareSync(validUser.password, stored.passwordHash)).toBe(true);
    expect(stored.role).toBe('client');
  });

  test('freelancer role is accepted and stored', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, role: 'freelancer' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'John Smith',
      email: 'john@example.com',
    });
    expect(response.body.role).toBeUndefined();

    const stored = await userRepository.findByEmail(validUser.email);
    expect(stored.role).toBe('freelancer');
  });

  test('missing role is rejected', async () => {
    const { role, ...withoutRole } = validUser;
    const response = await request(app).post('/api/auth/register').send(withoutRole);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Name, email, password and role are required.');
  });

  test('admin role cannot be self-registered', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, role: 'admin' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be client or freelancer.');

    const stored = await userRepository.findByEmail(validUser.email);
    expect(stored).toBeNull();
  });

  test('unknown role is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, role: 'manager' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be client or freelancer.');
  });
});
