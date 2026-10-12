import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders, Route } from '../test/renderWithProviders';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  test('shows the path tried and links to home and browse', () => {
    renderWithProviders(null, {
      route: '/does-not-exist?x=1',
      routes: <Route path="*" element={<NotFoundPage />} />,
    });

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('/does-not-exist?x=1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: 'Browse gigs' }).length).toBeGreaterThan(0);
  });
});
