import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, Route } from '../test/renderWithProviders';
import GigDetailPage from './GigDetailPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getGig: vi.fn(),
    createBooking: vi.fn(),
  };
});

import { createBooking, getGig } from '../api/http';

const gig = {
  id: 'gig-1',
  title: 'Logo design',
  description: 'Simple logo package',
  price: 150,
  freelancerId: 'free-1',
};

describe('GigDetailPage interactions', () => {
  beforeEach(() => {
    getGig.mockReset();
    createBooking.mockReset();
    getGig.mockResolvedValue(gig);
  });

  test('9.4.14 client Book shows confirmation', async () => {
    const user = userEvent.setup();
    createBooking.mockResolvedValue({
      id: 'booking-1',
      status: 'confirmed',
      confirmation: {
        paymentSimulated: true,
        message: 'Payment simulated successfully.',
      },
      transaction: {
        id: 'tx-1',
        amount: 150,
      },
    });

    renderWithProviders(null, {
      route: '/gigs/gig-1',
      auth: { role: 'client', sub: 'client-1' },
      routes: <Route path="/gigs/:id" element={<GigDetailPage />} />,
    });

    expect(await screen.findByRole('heading', { name: 'Logo design' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Book for/i }));

    await waitFor(() => {
      expect(createBooking).toHaveBeenCalledWith('gig-1');
    });

    expect(await screen.findByText(/Payment simulated successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View my bookings' })).toBeInTheDocument();
  });

  test('9.4.15 booking failure shows error alert', async () => {
    const user = userEvent.setup();
    createBooking.mockRejectedValue(new Error('Gig not found.'));

    renderWithProviders(null, {
      route: '/gigs/gig-1',
      auth: { role: 'client', sub: 'client-1' },
      routes: <Route path="/gigs/:id" element={<GigDetailPage />} />,
    });

    expect(await screen.findByRole('heading', { name: 'Logo design' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Book for/i }));

    expect(await screen.findByText('Gig not found.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View my bookings' })).not.toBeInTheDocument();
  });
});
