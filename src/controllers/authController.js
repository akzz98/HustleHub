const { validateRegistration, validateLogin } = require('../utils/validation');
const userService = require('../services/userService');

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

  res.status(200).json({ message: 'Login route is working.' });
}

module.exports = {
  register,
  login,
};
