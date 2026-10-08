import { apiBaseUrl } from './config';
import { getToken } from '../auth/tokenStorage';

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
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the server. Is the API running?');
  }

  if (response.status === 204) {
    if (!response.ok) {
      const error = new Error(`Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (body && typeof body.error === 'string' && body.error) ||
      `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
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

export {
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
};
