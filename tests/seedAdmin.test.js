const { seedAdmin } = require('../src/scripts/seedAdmin');
const userService = require('../src/services/userService');

describe('seedAdmin bootstrap', () => {
  const credentials = {
    name: 'Local Admin',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  };

  test('refuses to run when NODE_ENV is not development', async () => {
    await expect(
      seedAdmin({
        nodeEnv: 'production',
        ...credentials,
      })
    ).rejects.toThrow('Admin seeding is only allowed when NODE_ENV=development.');
  });

  test('creates an admin user in development', async () => {
    const result = await seedAdmin({
      nodeEnv: 'development',
      ...credentials,
    });

    expect(result).toEqual({
      created: true,
      email: 'admin@example.com',
      id: expect.any(String),
    });

    const stored = await userService.findByEmail(credentials.email);
    expect(stored.role).toBe('admin');
    expect(stored.passwordHash).toMatch(/^\$2[aby]?\$/);
    expect(userService.comparePassword(credentials.password, stored.passwordHash)).toBe(true);
  });

  test('is idempotent when the admin already exists', async () => {
    await seedAdmin({ nodeEnv: 'development', ...credentials });

    const second = await seedAdmin({
      nodeEnv: 'development',
      ...credentials,
    });

    expect(second).toEqual({
      created: false,
      email: 'admin@example.com',
      reason: 'already_exists',
    });
  });

  test('does not elevate an existing non-admin account', async () => {
    await userService.createUser('Cli Ent', credentials.email, credentials.password, 'client');

    await expect(
      seedAdmin({
        nodeEnv: 'development',
        ...credentials,
      })
    ).rejects.toThrow('An account with this email already exists.');

    const stored = await userService.findByEmail(credentials.email);
    expect(stored.role).toBe('client');
  });

  test('public registration still rejects admin', async () => {
    const request = require('supertest');
    const app = require('../src/app');

    const response = await request(app).post('/api/auth/register').send({
      name: 'Evil Admin',
      email: 'evil@example.com',
      password: 'SecurePassword123!',
      role: 'admin',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be client or freelancer.');
  });
});
