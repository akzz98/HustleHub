import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import RegisterPage from './RegisterPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    registerUser: vi.fn(),
  };
});

import { registerUser } from '../api/http';

describe('RegisterPage interactions', () => {
  beforeEach(() => {
    registerUser.mockReset();
  });

  test('9.4.1 empty submit shows field errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('name-error')).toHaveTextContent('Name is required.');
    expect(document.getElementById('email-error')).toHaveTextContent('Email is required.');
    expect(document.getElementById('password-error')).toHaveTextContent('Password is required.');
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('9.4.2 valid client submit shows success', async () => {
    const user = userEvent.setup();
    registerUser.mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/^Name$/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'SecurePassword123!');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'SecurePassword123!',
        role: 'client',
      });
    });

    expect(
      await screen.findByText(/Account created for Ada Lovelace \(ada@example.com\)/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name$/i)).toHaveValue('');
  });

  test('9.4.4 invalid email shows email field error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/^Name$/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email$/i), 'not-an-email');
    await user.type(screen.getByLabelText(/Password/i), 'SecurePassword123!');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('email-error')).toHaveTextContent('Enter a valid email address.');
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('9.4.5 weak password shows password field error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/^Name$/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('password-error')).toHaveTextContent(/uppercase, lowercase/i);
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('9.4.6 select Freelancer then successful submit', async () => {
    const user = userEvent.setup();
    registerUser.mockResolvedValue({
      id: 'user-2',
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/^Name$/i), 'Grace Hopper');
    await user.type(screen.getByLabelText(/^Email$/i), 'grace@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'SecurePassword123!');
    await user.click(screen.getByRole('radio', { name: 'Freelancer' }));
    expect(screen.getByRole('radio', { name: 'Freelancer' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        password: 'SecurePassword123!',
        role: 'freelancer',
      });
    });

    expect(await screen.findByText(/Account created for Grace Hopper/i)).toBeInTheDocument();
  });
});
