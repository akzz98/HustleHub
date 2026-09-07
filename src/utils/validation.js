function isPlainObject(value) {
  // Objects only — not arrays or null.
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  // "" and "   " count as empty.
  return typeof value === 'string' && value.trim() !== '';
}

function isValidEmail(value) {
  // local-part@domain.tld — rejects spaces and missing dots.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  // 8-128 chars, with upper, lower, digit, and a special character.
  if (value.length < 8 || value.length > 128) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
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

  if (!isValidEmail(email.trim())) {
    return 'Invalid email address.';
  }

  if (!isValidPassword(password)) {
    return 'Password must be 8-128 characters and include uppercase, lowercase, a number and a special character.';
  }

  return null;
}

function validateLogin(body) {
  if (!isPlainObject(body)) {
    return 'Invalid request body.';
  }

  const { email, password } = body;

  if (email === undefined || password === undefined) {
    return 'Email and password are required.';
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'Email and password must be strings.';
  }

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return 'Email and password are required.';
  }

  if (!isValidEmail(email.trim())) {
    return 'Invalid email address.';
  }

  return null;
}

module.exports = {
  validateRegistration,
  validateLogin,
};
