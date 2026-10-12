import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import GigsPage from './GigsPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listGigs: vi.fn(),
  };
});

import { listGigs } from '../api/http';

const sampleGigs = [
  {
    id: 'g1',
    title: 'Zebra logo',
    description: 'A bold mark for startups that need a memorable brand.',
    price: 200,
  },
  {
    id: 'g2',
    title: 'Alpha copy',
    description: 'Website wording that converts visitors into customers.',
    price: 80,
  },
  {
    id: 'g3',
    title: 'Beta site',
    description: 'Landing page layout with clear calls to action.',
    price: 150,
  },
];

describe('GigsPage', () => {
  beforeEach(() => {
    listGigs.mockReset();
  });

  test('lists gigs with excerpts, match count, search, and sort', async () => {
    const user = userEvent.setup();
    listGigs.mockResolvedValue(sampleGigs);

    renderWithProviders(<GigsPage />, { route: '/gigs' });

    expect(await screen.findByRole('status')).toHaveTextContent('3 gigs');
    expect(screen.getByText(/A bold mark for startups/i)).toBeInTheDocument();

    const list = screen.getByRole('list');
    const titles = within(list)
      .getAllByRole('link')
      .map((link) => within(link).getByText(/Zebra|Alpha|Beta/).textContent);
    expect(titles[0]).toBe('Alpha copy');

    await user.selectOptions(screen.getByLabelText(/^Sort$/i), 'price-desc');
    const byPrice = within(list)
      .getAllByRole('link')
      .map((link) => within(link).getByText(/Zebra|Alpha|Beta/).textContent);
    expect(byPrice[0]).toBe('Zebra logo');

    await user.type(screen.getByLabelText(/^Search$/i), 'landing');
    expect(await screen.findByRole('status')).toHaveTextContent('1 of 3 gigs match');
    expect(screen.getByText('Beta site')).toBeInTheDocument();
    expect(screen.queryByText('Zebra logo')).not.toBeInTheDocument();
  });

  test('empty catalog shows a next-step button', async () => {
    listGigs.mockResolvedValue([]);

    renderWithProviders(<GigsPage />, { route: '/gigs' });

    expect(await screen.findByText(/No gigs yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register to publish' })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  test('failed load shows Retry and reloads on click', async () => {
    const user = userEvent.setup();
    listGigs
      .mockRejectedValueOnce(new Error('Unable to reach the server. Is the API running?'))
      .mockResolvedValueOnce(sampleGigs);

    renderWithProviders(<GigsPage />, { route: '/gigs' });

    expect(
      await screen.findByText('Unable to reach the server. Is the API running?')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(listGigs).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Alpha copy')).toBeInTheDocument();
  });
});
