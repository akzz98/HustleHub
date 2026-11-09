const { Writable } = require('stream');
const {
  createLogger,
  shouldShipToCloud,
  resolveLogtailToken,
} = require('../src/utils/logger');

function createCapture() {
  const lines = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      const text = chunk.toString('utf8').trim();
      if (text) {
        lines.push(...text.split('\n').filter(Boolean));
      }
      callback();
    },
  });

  return {
    destination,
    lines,
    parseLatest() {
      return JSON.parse(lines[lines.length - 1]);
    },
  };
}

describe('logger', () => {
  test('writes JSON lines to the destination', () => {
    const capture = createCapture();
    const log = createLogger({ level: 'info', destination: capture.destination });

    log.info({ event: 'health_check' }, 'api ready');

    expect(capture.lines).toHaveLength(1);
    const entry = capture.parseLatest();
    expect(entry.level).toBeDefined();
    expect(entry.event).toBe('health_check');
    expect(entry.msg).toBe('api ready');
    expect(entry.service).toBe('hustlehub-api');
    expect(entry.time).toBeDefined();
  });

  test('redacts passwords, tokens, and secrets', () => {
    const capture = createCapture();
    const log = createLogger({ level: 'info', destination: capture.destination });

    log.info(
      {
        event: 'login_attempt',
        email: 'user@example.com',
        password: 'SecurePassword123!',
        token: 'jwt-should-not-appear',
        passwordHash: '$2b$10$not-a-real-hash',
        JWT_SECRET: 'super-secret',
        MONGODB_URI: 'mongodb://user:pass@127.0.0.1:27017/hustlehub',
        headers: { authorization: 'Bearer abc.def.ghi' },
      },
      'sensitive payload'
    );

    const entry = capture.parseLatest();
    const raw = capture.lines[capture.lines.length - 1];

    expect(entry.email).toBe('user@example.com');
    expect(entry.password).toBe('[Redacted]');
    expect(entry.token).toBe('[Redacted]');
    expect(entry.passwordHash).toBe('[Redacted]');
    expect(entry.JWT_SECRET).toBe('[Redacted]');
    expect(entry.MONGODB_URI).toBe('[Redacted]');
    expect(entry.headers.authorization).toBe('[Redacted]');

    expect(raw).not.toContain('SecurePassword123!');
    expect(raw).not.toContain('jwt-should-not-appear');
    expect(raw).not.toContain('super-secret');
    expect(raw).not.toContain('mongodb://user:pass@');
    expect(raw).not.toContain('Bearer abc.def.ghi');
  });

  test('cloud shipping stays off in test and when no source token is set', () => {
    const previous = process.env.LOGTAIL_SOURCE_TOKEN;
    delete process.env.LOGTAIL_SOURCE_TOKEN;

    expect(resolveLogtailToken()).toBe('');
    expect(shouldShipToCloud()).toBe(false);

    if (previous === undefined) {
      delete process.env.LOGTAIL_SOURCE_TOKEN;
    } else {
      process.env.LOGTAIL_SOURCE_TOKEN = previous;
    }
  });
});

