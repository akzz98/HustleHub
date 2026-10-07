const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/userService');
const gigRepository = require('../src/repositories/gigRepository');

describe('GET /api/gigs', () => {
  test('returns an empty list when there are no gigs', async () => {
    const response = await request(app).get('/api/gigs');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('lists gigs without authentication', async () => {
    const freelancer = await userService.createUser(
      'Free Lancer',
      'freelancer@example.com',
      'SecurePassword123!',
      'freelancer'
    );

    await gigRepository.create({
      title: 'Logo design',
      description: 'Simple logo package',
      price: 150,
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
