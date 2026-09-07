function register(req, res) {
  // Storage and validation.
  res.status(201).json({ message: 'Registration route is working.' });
}

module.exports = {
  register,
};
