const { prepareRegistrationInput, prepareLoginInput } = require('../utils/validation');
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');

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
    const user = await userService.findByEmail(email);

    if (!user) {
      // same message as a wrong password — don't leak whether the email exists
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = userService.comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

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
