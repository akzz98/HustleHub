import { apiBaseUrl } from './config';
import { getToken } from '../auth/tokenStorage';

class ApiError extends Error {
  constructor(message, status = null, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let unauthorizedHandler = null;

function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

function friendlyMessage(status, body) {
  if (body && typeof body.error === 'string' && body.error) {
    return body.error;
  }

  if (status === 401) {
    return 'Your session has expired or is invalid. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to do that.';
  }
  if (status === 404) {
    return 'The requested item was not found.';
  }
  if (status === 409) {
    return 'That action conflicts with an existing record.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Something went wrong on the server. Please try again.';
  }

  return `Request failed (${status}).`;
}

async function apiRequest(path, options = {}) {
  const { auth = false, headers: optionHeaders, ...fetchOptions } = options;
  const url = `${apiBaseUrl}${path}`;
  const headers = {
    ...(optionHeaders || {}),
  };

  if (fetchOptions.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError('Please sign in to continue.', 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Is the API running?');
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(friendlyMessage(response.status, null), response.status);
    }
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let body = null;

  if (isJson) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    if (auth && response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    throw new ApiError(friendlyMessage(response.status, body), response.status, body);
  }

  return body;
}

function registerUser({ name, email, password, role }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

function loginUser({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

function listGigs() {
  return apiRequest('/api/gigs');
}

function getGig(id) {
  return apiRequest(`/api/gigs/${id}`);
}

function createGig({ title, description, price }) {
  return apiRequest('/api/gigs', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ title, description, price }),
  });
}

function updateGig(id, { title, description, price }) {
  return apiRequest(`/api/gigs/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ title, description, price }),
  });
}

function deleteGig(id) {
  return apiRequest(`/api/gigs/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

function createBooking(gigId) {
  return apiRequest('/api/bookings', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ gigId }),
  });
}

function listMyBookings() {
  return apiRequest('/api/bookings', {
    method: 'GET',
    auth: true,
  });
}

function getMyIncome() {
  return apiRequest('/api/income/me', {
    method: 'GET',
    auth: true,
  });
}

export {
  ApiError,
  setUnauthorizedHandler,
  apiRequest,
  registerUser,
  loginUser,
  listGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
  createBooking,
  listMyBookings,
  getMyIncome,
};
