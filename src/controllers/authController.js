const { prepareRegistrationInput, prepareLoginInput } = require('../utils/validation');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const loginLockout = require('../services/loginLockout');
const { logger } = require('../utils/logger');

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';

function logLoginFailure(email, reason, lockState) {
  logger.warn({ event: 'login_failure', email, reason }, 'login failed');

  if (lockState.locked) {
    logger.warn({ event: 'login_lockout', email }, 'login lockout active');
  }
}

async function register(req, res, next) {
  try {
    const prepared = prepareRegistrationInput(req.body);

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const { name, email, password, role } = prepared.value;
    const existingUser = await userService.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await userService.createUser(name, email, password, role);

    // Part 1 shape preserved: id, name, email only (role is stored, not returned here)
    res.status(201).json(userService.toPublicUser(user));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function login(req, res, next) {
  try {
    const prepared = prepareLoginInput(req.body);

    if (prepared.error) {
      return res.status(400).json({ error: prepared.error });
    }

    const { email, password } = prepared.value;

    // Locked emails get the same generic 401 — no hint that the account exists or is locked.
    if (loginLockout.isLocked(email)) {
      logger.warn({ event: 'login_lockout', email }, 'login rejected — account locked');
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const user = await userService.findByEmail(email);

    if (!user) {
      const lockState = loginLockout.recordFailure(email);
      logLoginFailure(email, 'unknown_email', lockState);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const passwordMatches = userService.comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      const lockState = loginLockout.recordFailure(email);
      logLoginFailure(email, 'bad_password', lockState);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    loginLockout.clearAttempts(email);
    const token = tokenService.createAccessToken(user.id, user.role);

    logger.info(
      { event: 'login_success', email, userId: user.id, role: user.role },
      'login succeeded'
    );

    res.status(200).json(tokenService.toLoginResponse(token)); // still { token } only
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  register,
  login,
};
