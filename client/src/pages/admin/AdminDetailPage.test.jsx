import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, Route } from '../../test/renderWithProviders';
import RequireAdmin from '../../components/RequireAdmin';
import AdminDetailPage from './AdminDetailPage';

vi.mock('../../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getProfile: vi.fn().mockResolvedValue({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
    }),
    getAdminGig: vi.fn(),
  };
});

import { getAdminGig } from '../../api/http';

describe('AdminDetailPage', () => {
  beforeEach(() => {
    getAdminGig.mockReset();
  });

  test('shows read-only gig fields', async () => {
    getAdminGig.mockResolvedValue({
      id: 'g1',
      title: 'Logo design',
      description: 'Brand mark',
      price: 120,
      freelancerId: 'free-1',
    });

    renderWithProviders(null, {
      route: '/admin/gigs/g1',
      auth: { role: 'admin', sub: 'admin-1' },
      routes: (
        <Route
          path="/admin/:resourceKey/:id"
          element={
            <RequireAdmin>
              <AdminDetailPage />
            </RequireAdmin>
          }
        />
      ),
    });

    expect(await screen.findByRole('heading', { name: 'Gig' })).toBeInTheDocument();
    expect(screen.getByText('Logo design')).toBeInTheDocument();
    expect(screen.getByText('Brand mark')).toBeInTheDocument();
    expect(screen.getByText(/no edit or delete/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All gigs/i })).toHaveAttribute('href', '/admin/gigs');
  });
});
