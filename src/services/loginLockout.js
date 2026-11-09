// In-memory failed-login tracking keyed by normalised email.
// STEP 2.1: storage and rules only — login wiring is STEP 2.2.
//
// Locked rules:
//   - 5 failed attempts for one email → lock for 15 minutes
//   - successful login clears the counter (caller uses clearAttempts)
//   - emails are compared trimmed + lowercased

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function normaliseEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function createLoginLockoutStore({
  maxFailedAttempts = MAX_FAILED_ATTEMPTS,
  lockoutDurationMs = LOCKOUT_DURATION_MS,
  now = () => Date.now(),
} = {}) {
  // email → { failedAttempts, lockedUntil }
  const byEmail = new Map();

  function readEntry(email) {
    const key = normaliseEmail(email);
    if (!key) {
      return {
        key: '',
        failedAttempts: 0,
        lockedUntil: null,
        locked: false,
      };
    }

    const entry = byEmail.get(key);
    if (!entry) {
      return {
        key,
        failedAttempts: 0,
        lockedUntil: null,
        locked: false,
      };
    }

    if (entry.lockedUntil != null && entry.lockedUntil <= now()) {
      byEmail.delete(key);
      return {
        key,
        failedAttempts: 0,
        lockedUntil: null,
        locked: false,
      };
    }

    return {
      key,
      failedAttempts: entry.failedAttempts,
      lockedUntil: entry.lockedUntil,
      locked: entry.lockedUntil != null && entry.lockedUntil > now(),
    };
  }

  function getState(email) {
    const state = readEntry(email);
    return {
      failedAttempts: state.failedAttempts,
      lockedUntil: state.lockedUntil,
      locked: state.locked,
    };
  }

  function isLocked(email) {
    return readEntry(email).locked;
  }

  function recordFailure(email) {
    const current = readEntry(email);
    if (!current.key) {
      return getState(email);
    }

    if (current.locked) {
      return getState(email);
    }

    const failedAttempts = current.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= maxFailedAttempts ? now() + lockoutDurationMs : null;

    byEmail.set(current.key, { failedAttempts, lockedUntil });
    return getState(email);
  }

  function clearAttempts(email) {
    const key = normaliseEmail(email);
    if (key) {
      byEmail.delete(key);
    }
  }

  function clearAll() {
    byEmail.clear();
  }

  return {
    maxFailedAttempts,
    lockoutDurationMs,
    isLocked,
    getState,
    recordFailure,
    clearAttempts,
    clearAll,
  };
}

const loginLockout = createLoginLockoutStore();

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  createLoginLockoutStore,
  isLocked: loginLockout.isLocked,
  getState: loginLockout.getState,
  recordFailure: loginLockout.recordFailure,
  clearAttempts: loginLockout.clearAttempts,
  clearAll: loginLockout.clearAll,
};
