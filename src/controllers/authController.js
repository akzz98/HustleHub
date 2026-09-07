const { validateRegistration } = require('../utils/validation');
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

  res.status(201).json({ message: 'Registration route is working.' });
}

module.exports = {
  register,
};
