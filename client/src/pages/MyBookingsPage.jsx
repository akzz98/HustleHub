import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { listGigs, listMyBookings } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { buildLoginPath } from '../auth/authRedirect';
import AppNav from '../components/AppNav';
import LoadingRegion from '../components/LoadingRegion';
import { StatusMessage } from '../components/StatusMessage';
import { formatBookingStatus } from '../utils/bookingStatus';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function MyBookingsPage() {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookings, gigs] = await Promise.all([listMyBookings(), listGigs()]);
      const gigById = new Map((Array.isArray(gigs) ? gigs : []).map((gig) => [gig.id, gig]));
      const enriched = (Array.isArray(bookings) ? bookings : []).map((booking) => ({
        ...booking,
        gig: gigById.get(booking.gigId) || null,
      }));
      setRows(enriched);
    } catch (err) {
      setRows([]);
      setError(err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || role !== 'client') {
      return undefined;
    }

    load();
    return undefined;
  }, [isAuthenticated, role, load]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginPath({ from: `${location.pathname}${location.search}` })}
        replace
      />
    );
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

        <LoadingRegion loading={loading} label="Loading bookings…">
          <StatusMessage type="error">{error}</StatusMessage>

          {error ? (
            <p className="home-cta-row">
              <button type="button" className="primary-action" onClick={load}>
                Retry
              </button>
            </p>
          ) : null}

          {!error && rows.length === 0 ? (
            <>
              <p>No bookings yet.</p>
              <p className="home-cta-row">
                <Link className="primary-action-link" to="/gigs">
                  Browse gigs
                </Link>
              </p>
            </>
          ) : null}

          {!error && rows.length > 0 ? (
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
                      {formatBookingStatus(booking.status)}
                      {booking.gig ? ` · ${formatPrice(booking.gig.price)}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </LoadingRegion>
      </main>
    </>
  );
}

export default MyBookingsPage;
