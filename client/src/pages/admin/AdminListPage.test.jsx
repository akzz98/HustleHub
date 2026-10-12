import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderWithProviders, Route } from '../../test/renderWithProviders';
import RequireAdmin from '../../components/RequireAdmin';
import AdminListPage from './AdminListPage';

vi.mock('../../api/http', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getProfile: vi.fn().mockResolvedValue({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
    }),
    listAdminUsers: vi.fn(),
  };
});

import { listAdminUsers } from '../../api/http';

describe('AdminListPage', () => {
  beforeEach(() => {
    listAdminUsers.mockReset();
  });

  test('lists users for an admin', async () => {
    listAdminUsers.mockResolvedValue([
      { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'client' },
    ]);

    renderWithProviders(null, {
      route: '/admin/users',
      auth: { role: 'admin', sub: 'admin-1' },
      routes: (
        <Route
          path="/admin/:resourceKey"
          element={
            <RequireAdmin>
              <AdminListPage />
            </RequireAdmin>
          }
        />
      ),
    });

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ada Lovelace/i })).toHaveAttribute(
      'href',
      '/admin/users/u1'
    );
    expect(screen.getByText(/Read-only admin oversight/i)).toBeInTheDocument();
  });
});
