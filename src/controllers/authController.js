const { validateRegistration, validateLogin } = require('../utils/validation');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');

function register(req, res) {
  const error = validateRegistration(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  const existingUser = userService.findByEmail(req.body.email);

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const user = userService.createUser(req.body.name, req.body.email, req.body.password);

  res.status(201).json(userService.toPublicUser(user));
}

function login(req, res) {
  const error = validateLogin(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  const user = userService.findByEmail(req.body.email);

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
}

module.exports = {
  register,
  login,
};
