const {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  createLoginLockoutStore,
} = require('../src/services/loginLockout');

describe('loginLockout store', () => {
  test('a fresh email is not locked', () => {
    const store = createLoginLockoutStore();

    expect(store.isLocked('fresh@example.com')).toBe(false);
    expect(store.getState('fresh@example.com')).toEqual({
      failedAttempts: 0,
      lockedUntil: null,
      locked: false,
    });
  });

  test('four failures stay unlocked; the fifth locks for 15 minutes', () => {
    let now = 1_000_000;
    const store = createLoginLockoutStore({ now: () => now });
    const email = 'lockout@example.com';

    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i += 1) {
      const state = store.recordFailure(email);
      expect(state.locked).toBe(false);
      expect(state.failedAttempts).toBe(i);
      expect(state.lockedUntil).toBeNull();
    }

    const locked = store.recordFailure(email);
    expect(locked.locked).toBe(true);
    expect(locked.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
    expect(locked.lockedUntil).toBe(now + LOCKOUT_DURATION_MS);
    expect(store.isLocked(email)).toBe(true);

    // Further failures while locked do not extend or reset the window.
    const stillLocked = store.recordFailure(email);
    expect(stillLocked.lockedUntil).toBe(now + LOCKOUT_DURATION_MS);
    expect(stillLocked.failedAttempts).toBe(MAX_FAILED_ATTEMPTS);
  });

  test('clearAttempts removes the counter so login can succeed again', () => {
    const store = createLoginLockoutStore();
    const email = 'clear@example.com';

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      store.recordFailure(email);
    }
    expect(store.isLocked(email)).toBe(true);

    store.clearAttempts(email);

    expect(store.isLocked(email)).toBe(false);
    expect(store.getState(email)).toEqual({
      failedAttempts: 0,
      lockedUntil: null,
      locked: false,
    });
  });

  test('lockout expires after the configured window', () => {
    let now = 5_000_000;
    const store = createLoginLockoutStore({ now: () => now });
    const email = 'expire@example.com';

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      store.recordFailure(email);
    }
    expect(store.isLocked(email)).toBe(true);

    now += LOCKOUT_DURATION_MS;

    expect(store.isLocked(email)).toBe(false);
    expect(store.getState(email).failedAttempts).toBe(0);
  });

  test('email keys are trimmed and lowercased', () => {
    const store = createLoginLockoutStore();

    store.recordFailure('  Mixed.Case@Example.COM ');
    store.recordFailure('mixed.case@example.com');

    expect(store.getState('MIXED.CASE@EXAMPLE.COM').failedAttempts).toBe(2);
  });

  test('blank email is ignored and stays unlocked', () => {
    const store = createLoginLockoutStore();

    expect(store.recordFailure('   ')).toEqual({
      failedAttempts: 0,
      lockedUntil: null,
      locked: false,
    });
    expect(store.isLocked('')).toBe(false);
  });
});
