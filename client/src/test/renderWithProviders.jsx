import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { clearToken, setToken } from '../auth/tokenStorage';

function makeToken({ sub = 'user-1', role = 'client' } = {}) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, role }));
  return `${header}.${payload}.sig`;
}

function renderWithProviders(ui, { route = '/', auth = null, routes = null, ...options } = {}) {
  clearToken();
  if (auth) {
    setToken(makeToken(auth));
  }

  const tree = routes ? <Routes>{routes}</Routes> : ui;

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>{tree}</MemoryRouter>
    </AuthProvider>,
    options
  );
}

export { renderWithProviders, makeToken, Route };
