import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { listGigs, listMyBookings } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import AppNav from '../components/AppNav';
import { StatusMessage } from '../components/StatusMessage';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function MyBookingsPage() {
  const { isAuthenticated, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'client') {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [bookings, gigs] = await Promise.all([listMyBookings(), listGigs()]);
        if (cancelled) {
          return;
        }

        const gigById = new Map((Array.isArray(gigs) ? gigs : []).map((gig) => [gig.id, gig]));
        const enriched = (Array.isArray(bookings) ? bookings : []).map((booking) => ({
          ...booking,
          gig: gigById.get(booking.gigId) || null,
        }));
        setRows(enriched);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load bookings.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'client') {
    return (
      <>
        <AppNav />
        <main className="page">
          <h1>My bookings</h1>
          <StatusMessage type="error">
            This page is for client accounts. Freelancers can review bookings on their dashboard.
          </StatusMessage>
          <p className="footer-link">
            <Link to="/gigs">Browse gigs</Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <main className="page page-wide">
        <h1>My bookings</h1>
        <p className="lede">Bookings you placed as a client, with simulated confirmation status.</p>

        {loading ? <p>Loading…</p> : null}

        <StatusMessage type="error">{error}</StatusMessage>

        {!loading && !error && rows.length === 0 ? (
          <p>
            No bookings yet. <Link to="/gigs">Browse gigs</Link> to place one.
          </p>
        ) : null}

        {!loading && rows.length > 0 ? (
          <ul className="gig-list">
            {rows.map((booking) => (
              <li key={booking.id} className="manage-gig-row">
                <div>
                  {booking.gig ? (
                    <Link to={`/gigs/${booking.gigId}`} className="gig-title">
                      {booking.gig.title}
                    </Link>
                  ) : (
                    <span className="gig-title">Gig {booking.gigId}</span>
                  )}
                  <div className="hint">
                    Status: {booking.status}
                    {booking.gig ? ` · ${formatPrice(booking.gig.price)}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </>
  );
}

export default MyBookingsPage;
