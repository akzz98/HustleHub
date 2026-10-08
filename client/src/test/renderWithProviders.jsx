import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { clearToken, setToken } from '../auth/tokenStorage';

function makeToken({ sub = 'user-1', role = 'client' } = {}) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, role }));
  return `${header}.${payload}.sig`;
}

function renderWithProviders(ui, { route = '/', auth = null, ...options } = {}) {
  clearToken();
  if (auth) {
    setToken(makeToken(auth));
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthProvider>,
    options
  );
}

export { renderWithProviders, makeToken };
