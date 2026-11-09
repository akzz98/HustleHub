const { prepareRegistrationInput, prepareLoginInput } = require('../utils/validation');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const loginLockout = require('../services/loginLockout');

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';

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
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const user = await userService.findByEmail(email);

    if (!user) {
      loginLockout.recordFailure(email);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    const passwordMatches = userService.comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      loginLockout.recordFailure(email);
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
    }

    loginLockout.clearAttempts(email);
    const token = tokenService.createAccessToken(user.id, user.role);

    res.status(200).json(tokenService.toLoginResponse(token)); // still { token } only
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  register,
  login,
};
