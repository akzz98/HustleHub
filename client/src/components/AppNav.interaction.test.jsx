import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { getToken } from '../auth/tokenStorage';
import { renderWithProviders } from '../test/renderWithProviders';
import AppNav from './AppNav';

describe('AppNav interactions', () => {
  test('9.4.3 sign out clears the session and returns guest links', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppNav />, { auth: { role: 'client', sub: 'client-1' } });

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(getToken()).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(getToken()).toBeNull();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });
});
