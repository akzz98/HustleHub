const { PUBLIC_REGISTRATION_ROLES } = require('../models/User');
const { sanitisePlainText, containsDangerousContent } = require('./sanitise');

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

  const { name, email, password, role } = body;

  if (
    name === undefined ||
    email === undefined ||
    password === undefined ||
    role === undefined
  ) {
    return 'Name, email, password and role are required.';
  }

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof role !== 'string'
  ) {
    return 'Name, email, password and role must be strings.';
  }

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password) ||
    !isNonEmptyString(role)
  ) {
    return 'Name, email, password and role are required.';
  }

  if (name.trim().length > 100) {
    return 'Name must be at most 100 characters.'; // stored name cap
  }

  if (!isValidEmail(email.trim())) {
    return 'Invalid email address.';
  }

  if (!isValidPassword(password)) {
    return 'Password must be 8-128 characters and include uppercase, lowercase, a number and a special character.';
  }

  // Reject admin and any other value — public self-registration cannot elevate privileges.
  if (!PUBLIC_REGISTRATION_ROLES.includes(role.trim())) {
    return 'Role must be client or freelancer.';
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

  if (password.length > 128) {
    return 'Password must be at most 128 characters.'; // do not pass huge strings to bcrypt
  }

  return null;
}

function validateAdminSeedCredentials({ name, email, password }) {
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return 'ADMIN_SEED_NAME, ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.';
  }

  if (name.trim().length > 100) {
    return 'ADMIN_SEED_NAME must be at most 100 characters.';
  }

  if (!isValidEmail(email.trim())) {
    return 'ADMIN_SEED_EMAIL must be a valid email address.';
  }

  if (!isValidPassword(password)) {
    return 'ADMIN_SEED_PASSWORD must be 8-128 characters and include uppercase, lowercase, a number and a special character.';
  }

  return null;
}

function validateGigCreate(body) {
  if (!isPlainObject(body)) {
    return 'Invalid request body.';
  }

  const { title, description, price } = body;

  if (title === undefined || description === undefined || price === undefined) {
    return 'Title, description and price are required.';
  }

  if (typeof title !== 'string' || typeof description !== 'string') {
    return 'Title and description must be strings.';
  }

  if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
    return 'Title, description and price are required.';
  }

  if (containsDangerousContent(title) || containsDangerousContent(description)) {
    return 'Input contains disallowed content.';
  }

  if (title.trim().length > 120) {
    return 'Title must be at most 120 characters.';
  }

  if (description.trim().length > 2000) {
    return 'Description must be at most 2000 characters.';
  }

  // Number only — reject strings like "10" so types stay strict at the API boundary.
  if (typeof price !== 'number' || Number.isNaN(price) || !Number.isFinite(price)) {
    return 'Price must be a number.';
  }

  if (price < 0) {
    return 'Price must be at least 0.';
  }

  return null;
}

// Validate, then return sanitised fields for create/update (plain text only).
function prepareGigInput(body) {
  const error = validateGigCreate(body);

  if (error) {
    return { error };
  }

  const title = sanitisePlainText(body.title);
  const description = sanitisePlainText(body.description);

  if (!title || !description) {
    return { error: 'Title, description and price are required.' };
  }

  if (title.length > 120) {
    return { error: 'Title must be at most 120 characters.' };
  }

  if (description.length > 2000) {
    return { error: 'Description must be at most 2000 characters.' };
  }

  return {
    value: {
      title,
      description,
      price: body.price,
    },
  };
}

function validateBookingCreate(body) {
  if (!isPlainObject(body)) {
    return 'Invalid request body.';
  }

  const { gigId } = body;

  if (gigId === undefined) {
    return 'Gig id is required.';
  }

  if (typeof gigId !== 'string' || !isNonEmptyString(gigId)) {
    return 'Gig id must be a non-empty string.';
  }

  return null;
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateAdminSeedCredentials,
  validateGigCreate,
  prepareGigInput,
  validateBookingCreate,
};
