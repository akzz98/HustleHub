import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getMyIncome, listGigs, listMyBookings } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import AppNav from '../components/AppNav';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function FreelancerDashboardPage() {
  const { isAuthenticated, role } = useAuth();
  const [income, setIncome] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== 'freelancer') {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [incomeData, bookingData, gigs] = await Promise.all([
          getMyIncome(),
          listMyBookings(),
          listGigs(),
        ]);

        if (cancelled) {
          return;
        }

        const gigById = new Map((Array.isArray(gigs) ? gigs : []).map((gig) => [gig.id, gig]));
        const enriched = (Array.isArray(bookingData) ? bookingData : []).map((booking) => ({
          ...booking,
          gig: gigById.get(booking.gigId) || null,
        }));

        setIncome(incomeData);
        setBookings(enriched);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load dashboard.');
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

  if (role !== 'freelancer') {
    return (
      <>
        <AppNav />
        <main className="page">
          <h1>Freelancer dashboard</h1>
          <p className="message message-error" role="alert">
            This dashboard is for freelancer accounts only.
          </p>
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
        <h1>Freelancer dashboard</h1>
        <p className="lede">
          Income from confirmed bookings on your gigs, plus bookings clients have placed with you.
        </p>

        {loading ? <p>Loading…</p> : null}

        {error ? (
          <p className="message message-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && income ? (
          <section className="dashboard-income" aria-labelledby="income-heading">
            <h2 id="income-heading">Income</h2>
            <p className="income-total">{formatPrice(income.totalIncome)}</p>
            <p className="hint">
              From {income.transactionCount}{' '}
              {income.transactionCount === 1 ? 'transaction' : 'transactions'}.
            </p>
            <p className="footer-link" style={{ marginTop: '0.75rem' }}>
              <Link to="/my-gigs">Manage your gigs</Link>
            </p>
          </section>
        ) : null}

        {!loading && !error ? (
          <section className="manage-section" aria-labelledby="bookings-heading">
            <h2 id="bookings-heading">Bookings on your gigs</h2>
            {bookings.length === 0 ? (
              <p>No bookings on your gigs yet.</p>
            ) : (
              <ul className="gig-list">
                {bookings.map((booking) => (
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
                        {booking.gig ? ` · listed at ${formatPrice(booking.gig.price)}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </main>
    </>
  );
}

export default FreelancerDashboardPage;
