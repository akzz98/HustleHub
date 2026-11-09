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

const taxableIncome = {
  freelancerId: 'free-1',
  totalIncome: 20000,
  transactionCount: 1,
  estimatedTax: 1800,
  netAfterTax: 18200,
  effectiveRate: 0.09,
};

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

    getMyIncome.mockResolvedValue({
      totalIncome: 40,
      transactionCount: 1,
      estimatedTax: 0,
      netAfterTax: 40,
      effectiveRate: 0,
    });
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getAllByText(/\$40/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Income unavailable.')).not.toBeInTheDocument();
  });

  test('renders tax figures and chart labels from the income payload', async () => {
    getMyIncome.mockResolvedValue(taxableIncome);
    listMyBookings.mockResolvedValue([]);
    listGigs.mockResolvedValue([]);

    renderWithProviders(<FreelancerDashboardPage />, {
      route: '/dashboard',
      auth: { role: 'freelancer', sub: 'free-1' },
    });

    expect(await screen.findByRole('heading', { name: 'Income and tax' })).toBeInTheDocument();
    expect(screen.getByText('Gross income')).toBeInTheDocument();
    expect(screen.getAllByText('Estimated tax').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Net after tax')).toBeInTheDocument();
    expect(screen.getByText('Effective rate')).toBeInTheDocument();
    expect(screen.getByText('9%')).toBeInTheDocument();
    expect(
      screen.getByText(/Approximate tax on HustleHub income only/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Gross')).toBeInTheDocument();
    expect(screen.getByText('Net')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Gross \$20,000/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/\$20,000/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$1,800/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$18,200/).length).toBeGreaterThan(0);
    });
  });
});
