import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import AppNav from './AppNav';

describe('AppNav', () => {
  test('guest nav shows sign in and register', () => {
    renderWithProviders(<AppNav />);

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HustleHub+' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse gigs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My gigs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My bookings' })).not.toBeInTheDocument();
  });

  test('freelancer nav shows gigs and dashboard links', () => {
    renderWithProviders(<AppNav />, { auth: { role: 'freelancer', sub: 'free-1' } });

    expect(screen.getByRole('link', { name: 'My gigs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My bookings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  test('client nav shows bookings link', () => {
    renderWithProviders(<AppNav />, { auth: { role: 'client', sub: 'client-1' } });

    expect(screen.getByRole('link', { name: 'My bookings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My gigs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
