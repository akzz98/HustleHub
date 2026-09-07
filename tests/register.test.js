const fs = require('fs');
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app'); // Express app, not the HTTPS server
const { USERS_FILE_PATH } = require('../src/repositories/userRepository');

const validUser = {
  name: 'John Smith',
  email: 'john@example.com',
  password: 'SecurePassword123!',
};

function removeUsersFile() {
  if (fs.existsSync(USERS_FILE_PATH)) {
    fs.unlinkSync(USERS_FILE_PATH); // wipe generated test data
  }
}

beforeEach(removeUsersFile);
afterEach(removeUsersFile);

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

    const stored = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'))[0];

    expect(stored.password).toBeUndefined();
    expect(stored.passwordHash).toMatch(/^\$2[aby]?\$/); // bcrypt hash prefix
    expect(JSON.stringify(stored)).not.toContain(validUser.password);
    expect(bcrypt.compareSync(validUser.password, stored.passwordHash)).toBe(true);
  });
});
