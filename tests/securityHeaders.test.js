const request = require('supertest');
const app = require('../src/app');

describe('Helmet security headers', () => {
  test('responses include Content-Security-Policy and other Helmet headers', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);

    const csp = response.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('*'); // not a permissive wildcard CSP

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBeDefined();
  });

  test('API routes also receive the CSP header', async () => {
    const response = await request(app).get('/api/gigs');

    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });
});
