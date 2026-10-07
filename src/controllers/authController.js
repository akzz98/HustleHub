const { validateRegistration, validateLogin } = require('../utils/validation');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');

async function register(req, res, next) {
  try {
    const error = validateRegistration(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const existingUser = await userService.findByEmail(req.body.email);

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await userService.createUser(
      req.body.name,
      req.body.email,
      req.body.password,
      req.body.role
    );

    // Part 1 shape preserved: id, name, email only (role is stored, not returned here)
    res.status(201).json(userService.toPublicUser(user));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

async function login(req, res, next) {
  try {
    const error = validateLogin(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const user = await userService.findByEmail(req.body.email);

    if (!user) {
      // same message as a wrong password — don't leak whether the email exists
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = userService.comparePassword(req.body.password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = tokenService.createAccessToken(user.id);

    res.status(200).json(tokenService.toLoginResponse(token));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  register,
  login,
};
