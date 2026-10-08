import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import HomePage from './HomePage';

describe('HomePage', () => {
  test('renders brand heading and browse link for guests', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'HustleHub+' })).toBeInTheDocument();
    expect(screen.getByText(/Freelance marketplace/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Browse gigs' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows signed-in role when authenticated', () => {
    renderWithProviders(<HomePage />, { auth: { role: 'freelancer', sub: 'free-1' } });

    expect(screen.getByRole('status')).toHaveTextContent(/Signed in as/i);
    expect(screen.getByRole('status')).toHaveTextContent('freelancer');
  });
});
