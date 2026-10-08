import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getToken } from '../auth/tokenStorage';
import { makeToken, renderWithProviders, Route } from '../test/renderWithProviders';
import LoginPage from './LoginPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loginUser: vi.fn(),
  };
});

import { loginUser } from '../api/http';

describe('LoginPage interactions', () => {
  beforeEach(() => {
    loginUser.mockReset();
  });

  test('9.4.7 empty submit shows field errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('email-error')).toHaveTextContent('Email is required.');
    expect(document.getElementById('password-error')).toHaveTextContent('Password is required.');
    expect(loginUser).not.toHaveBeenCalled();
  });

  test('9.4.8 wrong credentials shows API error message', async () => {
    const user = userEvent.setup();
    loginUser.mockRejectedValue(new Error('Invalid email or password.'));

    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'WrongPassword123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  test('9.4.9 success stores token and leaves login page', async () => {
    const user = userEvent.setup();
    const token = makeToken({ sub: 'user-9', role: 'client' });
    loginUser.mockResolvedValue({ token });

    renderWithProviders(null, {
      route: '/login',
      routes: (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<h1>Home landed</h1>} />
        </>
      ),
    });

    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'SecurePassword123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalled();
    });

    expect(await screen.findByRole('heading', { name: 'Home landed' })).toBeInTheDocument();
    expect(getToken()).toBe(token);
  });
});
