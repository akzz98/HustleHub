function isNonEmpty(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPassword(value) {
  if (value.length < 8 || value.length > 128) {
    return false;
  }

  return (
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function validateRegistrationForm({ name, email, password, role }) {
  const fieldErrors = {};

  if (!isNonEmpty(name)) {
    fieldErrors.name = 'Name is required.';
  } else if (name.trim().length > 100) {
    fieldErrors.name = 'Name must be at most 100 characters.';
  }

  if (!isNonEmpty(email)) {
    fieldErrors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  if (!isNonEmpty(password)) {
    fieldErrors.password = 'Password is required.';
  } else if (!isValidPassword(password)) {
    fieldErrors.password =
      'Password must be 8–128 characters with uppercase, lowercase, a number, and a special character.';
  }

  if (role !== 'client' && role !== 'freelancer') {
    fieldErrors.role = 'Choose client or freelancer.';
  }

  return fieldErrors;
}

function validateLoginForm({ email, password }) {
  const fieldErrors = {};

  if (!isNonEmpty(email)) {
    fieldErrors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    fieldErrors.email = 'Enter a valid email address.';
  }

  if (!isNonEmpty(password)) {
    fieldErrors.password = 'Password is required.';
  } else if (password.length > 128) {
    fieldErrors.password = 'Password must be at most 128 characters.';
  }

  return fieldErrors;
}

function validateGigForm({ title, description, price }) {
  const fieldErrors = {};

  if (!isNonEmpty(title)) {
    fieldErrors.title = 'Title is required.';
  } else if (title.trim().length > 120) {
    fieldErrors.title = 'Title must be at most 120 characters.';
  }

  if (!isNonEmpty(description)) {
    fieldErrors.description = 'Description is required.';
  } else if (description.trim().length > 2000) {
    fieldErrors.description = 'Description must be at most 2000 characters.';
  }

  if (price === '' || price === null || price === undefined) {
    fieldErrors.price = 'Price is required.';
  } else {
    const numeric = Number(price);
    if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
      fieldErrors.price = 'Price must be a number.';
    } else if (numeric < 0) {
      fieldErrors.price = 'Price must be at least 0.';
    }
  }

  return fieldErrors;
}

function hasFieldErrors(fieldErrors) {
  return Object.keys(fieldErrors).length > 0;
}

export {
  validateRegistrationForm,
  validateLoginForm,
  validateGigForm,
  hasFieldErrors,
};
