import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import HomePage from './HomePage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listMyBookings: vi.fn(),
    listGigs: vi.fn(),
    getMyIncome: vi.fn(),
  };
});

import { getMyIncome, listGigs, listMyBookings } from '../api/http';

describe('HomePage', () => {
  beforeEach(() => {
    listMyBookings.mockReset();
    listGigs.mockReset();
    getMyIncome.mockReset();
  });

  test('guest home shows how-it-works plus browse and register', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'HustleHub+' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText(/Register as a client/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Browse gigs' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Register' }).length).toBeGreaterThan(0);
  });

  test('client home shows bookings and browse', async () => {
    listMyBookings.mockResolvedValue([
      { id: 'b1', gigId: 'g1', status: 'confirmed' },
    ]);
    listGigs.mockResolvedValue([{ id: 'g1', title: 'Logo design', price: 50 }]);

    renderWithProviders(<HomePage />, { auth: { role: 'client', sub: 'client-1' } });

    expect(await screen.findByRole('heading', { name: 'Your bookings' })).toBeInTheDocument();
    expect(await screen.findByText('Logo design')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Browse gigs' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'View all bookings' })).toHaveAttribute(
      'href',
      '/my-bookings'
    );
  });

  test('freelancer home shows income, bookings, and create gig', async () => {
    getMyIncome.mockResolvedValue({ totalIncome: 120, transactionCount: 2 });
    listMyBookings.mockResolvedValue([
      { id: 'b2', gigId: 'g2', status: 'confirmed' },
    ]);
    listGigs.mockResolvedValue([{ id: 'g2', title: 'Website fix', price: 60 }]);

    renderWithProviders(<HomePage />, { auth: { role: 'freelancer', sub: 'free-1' } });

    expect(await screen.findByRole('heading', { name: 'Income' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/\$120/)).toBeInTheDocument();
    });
    expect(await screen.findByRole('heading', { name: 'Incoming bookings' })).toBeInTheDocument();
    expect(screen.getByText('Website fix')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a gig' })).toHaveAttribute('href', '/my-gigs');
  });
});
