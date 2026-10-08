import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import ManageGigsPage from './ManageGigsPage';

vi.mock('../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listGigs: vi.fn(),
    createGig: vi.fn(),
    updateGig: vi.fn(),
    deleteGig: vi.fn(),
  };
});

import { createGig, deleteGig, listGigs, updateGig } from '../api/http';

const FREELANCER_ID = 'free-1';

describe('ManageGigsPage interactions', () => {
  beforeEach(() => {
    listGigs.mockReset();
    createGig.mockReset();
    updateGig.mockReset();
    deleteGig.mockReset();
    listGigs.mockResolvedValue([]);
  });

  test('9.4.10 empty create submit shows field errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManageGigsPage />, {
      route: '/my-gigs',
      auth: { role: 'freelancer', sub: FREELANCER_ID },
    });

    await screen.findByRole('heading', { name: 'Manage your gigs' });
    await user.click(screen.getByRole('button', { name: 'Create gig' }));

    expect(await screen.findByText('Please fix the highlighted fields.')).toBeInTheDocument();
    expect(document.getElementById('title-error')).toHaveTextContent('Title is required.');
    expect(document.getElementById('description-error')).toHaveTextContent('Description is required.');
    expect(document.getElementById('price-error')).toHaveTextContent('Price is required.');
    expect(createGig).not.toHaveBeenCalled();
  });

  test('9.4.11 create gig succeeds and appears in list', async () => {
    const user = userEvent.setup();
    let gigs = [];
    listGigs.mockImplementation(async () => gigs);
    createGig.mockImplementation(async (payload) => {
      const gig = {
        id: 'gig-new',
        freelancerId: FREELANCER_ID,
        ...payload,
      };
      gigs = [...gigs, gig];
      return gig;
    });

    renderWithProviders(<ManageGigsPage />, {
      route: '/my-gigs',
      auth: { role: 'freelancer', sub: FREELANCER_ID },
    });

    await screen.findByText('You have not published any gigs yet.');

    await user.type(screen.getByLabelText(/^Title$/i), 'Logo design');
    await user.type(screen.getByLabelText(/^Description$/i), 'Simple logo package');
    await user.type(screen.getByLabelText(/Price/i), '150');
    await user.click(screen.getByRole('button', { name: 'Create gig' }));

    expect(await screen.findByText('Gig created.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Logo design' })).toBeInTheDocument();
    expect(createGig).toHaveBeenCalledWith({
      title: 'Logo design',
      description: 'Simple logo package',
      price: 150,
    });
  });

  test('9.4.12 Edit loads form; Save updates listing', async () => {
    const user = userEvent.setup();
    let gigs = [
      {
        id: 'gig-1',
        title: 'Old title',
        description: 'Old description',
        price: 40,
        freelancerId: FREELANCER_ID,
      },
    ];
    listGigs.mockImplementation(async () => gigs);
    updateGig.mockImplementation(async (id, payload) => {
      gigs = gigs.map((gig) => (gig.id === id ? { ...gig, ...payload } : gig));
      return gigs.find((gig) => gig.id === id);
    });

    renderWithProviders(<ManageGigsPage />, {
      route: '/my-gigs',
      auth: { role: 'freelancer', sub: FREELANCER_ID },
    });

    await screen.findByRole('link', { name: 'Old title' });
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Edit gig' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Title$/i)).toHaveValue('Old title');

    await user.clear(screen.getByLabelText(/^Title$/i));
    await user.type(screen.getByLabelText(/^Title$/i), 'Updated title');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Gig updated.')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Updated title' })).toBeInTheDocument();
    expect(updateGig).toHaveBeenCalledWith('gig-1', {
      title: 'Updated title',
      description: 'Old description',
      price: 40,
    });
  });

  test('9.4.13 Delete confirms and removes listing', async () => {
    const user = userEvent.setup();
    let gigs = [
      {
        id: 'gig-1',
        title: 'Disposable gig',
        description: 'Gone soon',
        price: 25,
        freelancerId: FREELANCER_ID,
      },
    ];
    listGigs.mockImplementation(async () => gigs);
    deleteGig.mockImplementation(async (id) => {
      gigs = gigs.filter((gig) => gig.id !== id);
      return null;
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<ManageGigsPage />, {
      route: '/my-gigs',
      auth: { role: 'freelancer', sub: FREELANCER_ID },
    });

    const row = (await screen.findByRole('link', { name: 'Disposable gig' })).closest('li');
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText('Gig deleted.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Disposable gig' })).not.toBeInTheDocument();
    });
    expect(deleteGig).toHaveBeenCalledWith('gig-1');
  });
});
