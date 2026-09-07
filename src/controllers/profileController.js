const userService = require('../services/userService');

function getProfile(req, res) {
  const user = userService.findById(req.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // id, name, email — no password hash
  res.status(200).json(userService.toPublicUser(user));
}

module.exports = {
  getProfile,
};
