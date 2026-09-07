const { validateRegistration } = require('../utils/validation');

function register(req, res) {
  const error = validateRegistration(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  res.status(201).json({ message: 'Registration route is working.' });
}

module.exports = {
  register,
};
