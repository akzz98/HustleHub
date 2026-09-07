const fs = require('fs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
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

async function registerUser() {
  const response = await request(app).post('/api/auth/register').send(validUser);
  return response.body;
}

beforeEach(removeUsersFile);
afterEach(removeUsersFile);

describe('POST /api/auth/login', () => {
  test('valid credentials return 200 and a token only', async () => {
    await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ token: expect.any(String) });
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.id).toBeUndefined();
    expect(response.body.email).toBeUndefined();
  });

  test('issued token is a JWT with the user id in sub', async () => {
    const registered = await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const payload = jwt.verify(response.body.token, process.env.JWT_SECRET);

    expect(payload.sub).toBe(registered.id);
    expect(payload.password).toBeUndefined();
    expect(payload.passwordHash).toBeUndefined();
  });

  test('missing fields are rejected', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('invalid email is rejected', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: validUser.password });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email address.');
  });

  test('unknown email returns a generic 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    // same text as a wrong password — does not say whether the email exists
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password.');
  });

  test('wrong password returns the same generic 401', async () => {
    await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password.');
  });
});
