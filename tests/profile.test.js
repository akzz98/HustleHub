const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app'); // Express app, not the HTTPS server
const { User } = require('../src/models/User');

const validUser = {
  name: 'John Smith',
  email: 'john@example.com',
  password: 'SecurePassword123!',
};

async function registerAndLogin() {
  const registered = await request(app).post('/api/auth/register').send(validUser);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: validUser.email, password: validUser.password });

  return { user: registered.body, token: login.body.token };
}

describe('GET /api/profile', () => {
  test('valid token returns 200 and public fields only', async () => {
    const { user, token } = await registerAndLogin();

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: user.id,
      name: 'John Smith',
      email: 'john@example.com',
    });
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
  });

  test('missing Authorization header is rejected', async () => {
    const response = await request(app).get('/api/profile');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required.');
  });

  test('malformed Authorization header is rejected', async () => {
    const { token } = await registerAndLogin();

    // Scheme must be Bearer — Token is the wrong prefix
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Token ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid authorization header.');
  });

  test('invalid token is rejected', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or expired token.');
  });

  test('expired token is rejected', async () => {
    const { user } = await registerAndLogin();
    const expiredToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
      algorithm: 'HS256',
    }); // already expired

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or expired token.');
  });

  test('token signed with a different algorithm is rejected', async () => {
    const { user } = await registerAndLogin();
    const otherAlgToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { algorithm: 'HS384' });

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${otherAlgToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid or expired token.');
  });

  test('valid token for a missing user returns 404', async () => {
    const { token } = await registerAndLogin();
    await User.deleteMany({}); // token still valid, store is empty

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found.');
  });
});
