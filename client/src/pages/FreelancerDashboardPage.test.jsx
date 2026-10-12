import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import FreelancerDashboardPage from './FreelancerDashboardPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getProfile: vi.fn().mockResolvedValue({
      id: 'free-1',
      name: 'Grace Hopper',
      email: 'grace@example.com',
    }),
    getMyIncome: vi.fn(),
    listMyBookings: vi.fn(),
    listGigs: vi.fn(),
  };
});

import { getMyIncome, listGigs, listMyBookings } from '../api/http';

describe('FreelancerDashboardPage', () => {
  beforeEach(() => {
    getMyIncome.mockReset();
    listMyBookings.mockReset();
    listGigs.mockReset();
  });

  test('income and bookings can fail separately with their own Retry', async () => {
    const user = userEvent.setup();
    getMyIncome.mockRejectedValue(new Error('Income unavailable.'));
    listMyBookings.mockResolvedValue([]);
    listGigs.mockResolvedValue([]);

    renderWithProviders(<FreelancerDashboardPage />, {
      route: '/dashboard',
      auth: { role: 'freelancer', sub: 'free-1' },
    });

    expect(await screen.findByText('Income unavailable.')).toBeInTheDocument();
    expect(screen.getByText('No bookings on your gigs yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Publish a gig' })).toHaveAttribute(
      'href',
      '/my-gigs'
    );

    getMyIncome.mockResolvedValue({ totalIncome: 40, transactionCount: 1 });
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText(/\$40/)).toBeInTheDocument();
    });
    expect(screen.queryByText('Income unavailable.')).not.toBeInTheDocument();
  });
});
