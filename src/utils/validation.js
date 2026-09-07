function isPlainObject(value) {
  // Objects only — not arrays or null.
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  // "" and "   " count as empty.
  return typeof value === 'string' && value.trim() !== '';
}

function validateRegistration(body) {
  if (!isPlainObject(body)) {
    return 'Invalid request body.';
  }

  const { name, email, password } = body;

  if (name === undefined || email === undefined || password === undefined) {
    return 'Name, email and password are required.';
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return 'Name, email and password must be strings.';
  }

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return 'Name, email and password are required.';
  }

  return null;
}

module.exports = {
  validateRegistration,
};
