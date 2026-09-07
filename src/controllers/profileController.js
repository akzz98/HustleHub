const userService = require('../services/userService');

function getProfile(req, res, next) {
  try {
    const user = userService.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // id, name, email — no password hash
    res.status(200).json(userService.toPublicUser(user));
  } catch (err) {
    next(err); // unexpected failures → errorHandler (generic 500)
  }
}

module.exports = {
  getProfile,
};
