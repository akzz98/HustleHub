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

  test('shows field errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('name-error')).toHaveTextContent('Name is required.');
    expect(document.getElementById('email-error')).toHaveTextContent('Email is required.');
    expect(document.getElementById('password-error')).toHaveTextContent('Password is required.');
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('submits valid details and shows success feedback', async () => {
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
    await user.click(screen.getByRole('radio', { name: 'Freelancer' }));
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'SecurePassword123!',
        role: 'freelancer',
      });
    });

    expect(
      await screen.findByText(/Account created for Ada Lovelace \(ada@example.com\)/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name$/i)).toHaveValue('');
  });
});
