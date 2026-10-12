import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { getMyIncome, listGigs, listMyBookings } from '../api/http';
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

function FreelancerDashboardPage() {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();
  const [income, setIncome] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [incomeError, setIncomeError] = useState('');
  const [bookingsError, setBookingsError] = useState('');
  const [incomeLoading, setIncomeLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const loadIncome = useCallback(async () => {
    setIncomeLoading(true);
    setIncomeError('');
    try {
      const incomeData = await getMyIncome();
      setIncome(incomeData);
    } catch (err) {
      setIncome(null);
      setIncomeError(err.message || 'Could not load income.');
    } finally {
      setIncomeLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const [bookingData, gigs] = await Promise.all([listMyBookings(), listGigs()]);
      const gigById = new Map((Array.isArray(gigs) ? gigs : []).map((gig) => [gig.id, gig]));
      const enriched = (Array.isArray(bookingData) ? bookingData : []).map((booking) => ({
        ...booking,
        gig: gigById.get(booking.gigId) || null,
      }));
      setBookings(enriched);
    } catch (err) {
      setBookings([]);
      setBookingsError(err.message || 'Could not load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || role !== 'freelancer') {
      return undefined;
    }

    loadIncome();
    loadBookings();
    return undefined;
  }, [isAuthenticated, role, loadIncome, loadBookings]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginPath({ from: `${location.pathname}${location.search}` })}
        replace
      />
    );
  }

  if (role !== 'freelancer') {
    return (
      <>
        <AppNav />
        <main className="page">
          <h1>Freelancer dashboard</h1>
          <StatusMessage type="error">This dashboard is for freelancer accounts only.</StatusMessage>
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

        <section className="dashboard-income" aria-labelledby="income-heading">
          <h2 id="income-heading">Income</h2>
          <LoadingRegion loading={incomeLoading} label="Loading income…">
            <StatusMessage type="error">{incomeError}</StatusMessage>
            {incomeError ? (
              <p className="home-cta-row">
                <button type="button" className="primary-action" onClick={loadIncome}>
                  Retry
                </button>
              </p>
            ) : null}
            {!incomeError && income ? (
              <>
                <p className="income-total">{formatPrice(income.totalIncome)}</p>
                <p className="hint">
                  From {income.transactionCount}{' '}
                  {income.transactionCount === 1 ? 'transaction' : 'transactions'}.
                </p>
                <p className="footer-link" style={{ marginTop: '0.75rem' }}>
                  <Link to="/my-gigs">Manage your gigs</Link>
                </p>
              </>
            ) : null}
          </LoadingRegion>
        </section>

        <section className="manage-section" aria-labelledby="bookings-heading">
          <h2 id="bookings-heading">Bookings on your gigs</h2>
          <LoadingRegion loading={bookingsLoading} label="Loading bookings…">
            <StatusMessage type="error">{bookingsError}</StatusMessage>
            {bookingsError ? (
              <p className="home-cta-row">
                <button type="button" className="primary-action" onClick={loadBookings}>
                  Retry
                </button>
              </p>
            ) : null}
            {!bookingsError && bookings.length === 0 ? (
              <>
                <p>No bookings on your gigs yet.</p>
                <p className="home-cta-row">
                  <Link className="primary-action-link" to="/my-gigs">
                    Publish a gig
                  </Link>
                </p>
              </>
            ) : null}
            {!bookingsError && bookings.length > 0 ? (
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
                        {formatBookingStatus(booking.status)}
                        {booking.gig ? ` · listed at ${formatPrice(booking.gig.price)}` : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </LoadingRegion>
        </section>
      </main>
    </>
  );
}

export default FreelancerDashboardPage;
