import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import AppNav from './AppNav';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getProfile: vi.fn(),
  };
});

import { getProfile } from '../api/http';

describe('AppNav', () => {
  beforeEach(() => {
    getProfile.mockReset();
    getProfile.mockResolvedValue({ id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  test('guest nav shows sign in and register', () => {
    renderWithProviders(<AppNav />, { route: '/login' });

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HustleHub+' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse gigs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveClass('is-current');
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My gigs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My bookings' })).not.toBeInTheDocument();
    expect(getProfile).not.toHaveBeenCalled();
  });

  test('freelancer nav shows gigs and dashboard links', async () => {
    getProfile.mockResolvedValue({ id: 'free-1', name: 'Grace Hopper', email: 'grace@example.com' });
    renderWithProviders(<AppNav />, { auth: { role: 'freelancer', sub: 'free-1' } });

    expect(screen.getByRole('link', { name: 'My gigs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My bookings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('freelancer')).toBeInTheDocument();
  });

  test('client nav shows bookings link', async () => {
    renderWithProviders(<AppNav />, { auth: { role: 'client', sub: 'client-1' } });

    expect(screen.getByRole('link', { name: 'My bookings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My gigs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(getProfile).toHaveBeenCalled();
    });
  });

  test('admin nav shows oversight links and hides freelancer/client tools', async () => {
    getProfile.mockResolvedValue({ id: 'admin-1', name: 'Admin User', email: 'admin@example.com' });
    renderWithProviders(<AppNav />, { auth: { role: 'admin', sub: 'admin-1' } });

    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: 'Gigs' })).toHaveAttribute('href', '/admin/gigs');
    expect(screen.getByRole('link', { name: 'Bookings' })).toHaveAttribute(
      'href',
      '/admin/bookings'
    );
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'href',
      '/admin/transactions'
    );
    expect(screen.queryByRole('link', { name: 'My gigs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My bookings' })).not.toBeInTheDocument();
    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
