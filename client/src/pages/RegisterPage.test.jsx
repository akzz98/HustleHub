import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  test('renders registration form fields', () => {
    renderWithProviders(<RegisterPage />, { route: '/register' });

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Client' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Freelancer' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
