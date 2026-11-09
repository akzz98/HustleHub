const request = require('supertest');
const app = require('../src/app');
const { MAX_FAILED_ATTEMPTS } = require('../src/services/loginLockout');
const { logger } = require('../src/utils/logger');

describe('login event logging', () => {
  const user = {
    name: 'Log User',
    email: 'login-logging@example.com',
    password: 'SecurePassword123!',
    role: 'freelancer',
  };

  let infoSpy;
  let warnSpy;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  async function registerUser() {
    const response = await request(app).post('/api/auth/register').send(user);
    expect(response.status).toBe(201);
    return response.body;
  }

  function payloadsFor(eventName) {
    return [...infoSpy.mock.calls, ...warnSpy.mock.calls]
      .map(([payload]) => payload)
      .filter((payload) => payload && payload.event === eventName);
  }

  test('logs login_success without password or token', async () => {
    const registered = await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);

    const successLogs = payloadsFor('login_success');
    expect(successLogs).toHaveLength(1);
    expect(successLogs[0]).toEqual({
      event: 'login_success',
      email: user.email,
      userId: registered.id,
      role: 'freelancer',
    });
    expect(successLogs[0].password).toBeUndefined();
    expect(successLogs[0].token).toBeUndefined();
  });

  test('logs login_failure for a wrong password', async () => {
    await registerUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword123!' });

    expect(response.status).toBe(401);

    const failureLogs = payloadsFor('login_failure');
    expect(failureLogs).toEqual([
      {
        event: 'login_failure',
        email: user.email,
        reason: 'bad_password',
      },
    ]);
    expect(failureLogs[0].password).toBeUndefined();
  });

  test('logs login_lockout when the account becomes locked and on later attempts', async () => {
    await registerUser();

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPassword123!' });
    }

    const lockoutAfterThreshold = payloadsFor('login_lockout');
    expect(lockoutAfterThreshold).toHaveLength(1);
    expect(lockoutAfterThreshold[0]).toEqual({
      event: 'login_lockout',
      email: user.email,
    });

    warnSpy.mockClear();

    const lockedAttempt = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });

    expect(lockedAttempt.status).toBe(401);
    expect(payloadsFor('login_lockout')).toEqual([
      {
        event: 'login_lockout',
        email: user.email,
      },
    ]);
    expect(payloadsFor('login_success')).toHaveLength(0);
  });
});
