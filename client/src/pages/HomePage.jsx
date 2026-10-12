import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyIncome, listGigs, listMyBookings } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import AppNav from '../components/AppNav';
import LoadingRegion from '../components/LoadingRegion';
import { StatusMessage } from '../components/StatusMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatBookingStatus } from '../utils/bookingStatus';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function GuestHome() {
  return (
    <main id="main-content" className="page" tabIndex={-1}>
      <h1>HustleHub+</h1>
      <p className="lede">
        A freelance marketplace where clients book gigs and freelancers get paid for confirmed work.
      </p>

      <section aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="form-heading">
          How it works
        </h2>
        <ol className="how-it-works">
          <li>Register as a client (hire) or a freelancer (offer services).</li>
          <li>Browse the catalog, or publish a gig if you are a freelancer.</li>
          <li>Book work as a client. Freelancers track bookings and income.</li>
        </ol>
      </section>

      <p className="home-cta-row">
        <Link className="primary-action-link" to="/gigs">
          Browse gigs
        </Link>
        <Link className="secondary-action-link" to="/register">
          Register
        </Link>
      </p>
    </main>
  );
}

function BookingPreviewList({ rows, emptyContent }) {
  if (rows.length === 0) {
    return emptyContent;
  }

  return (
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
  );
}

function ClientHome() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <main id="main-content" className="page page-wide ui-sans" tabIndex={-1}>
      <h1>Home</h1>
      <p className="lede">Your bookings at a glance. Browse the catalog when you are ready to hire.</p>

      <section aria-labelledby="home-bookings-heading">
        <h2 id="home-bookings-heading" className="form-heading">
          Your bookings
        </h2>
        <LoadingRegion loading={loading} label="Loading bookings…">
          <StatusMessage type="error">{error}</StatusMessage>
          {!error ? (
            <BookingPreviewList
              rows={rows}
              emptyContent={
                <>
                  <p>No bookings yet.</p>
                  <p className="home-cta-row">
                    <Link className="primary-action-link" to="/gigs">
                      Browse gigs
                    </Link>
                  </p>
                </>
              }
            />
          ) : null}
          {!error && rows.length > 0 ? (
            <p className="footer-link">
              <Link className="inline-action" to="/my-bookings">
                View all bookings
              </Link>
            </p>
          ) : null}
        </LoadingRegion>
      </section>

      {!loading && !error && rows.length > 0 ? (
        <p className="home-cta-row">
          <Link className="primary-action-link" to="/gigs">
            Browse gigs
          </Link>
        </p>
      ) : null}
    </main>
  );
}

function FreelancerHome() {
  const [income, setIncome] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setError(err.message || 'Could not load home.');
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
  }, []);

  return (
    <main id="main-content" className="page page-wide ui-sans" tabIndex={-1}>
      <h1>Home</h1>
      <p className="lede">
        Income from confirmed bookings on your gigs, plus clients who have booked with you.
      </p>

      <LoadingRegion loading={loading} label="Loading home…">
        <StatusMessage type="error">{error}</StatusMessage>

        {!error && income ? (
          <section className="dashboard-income" aria-labelledby="home-income-heading">
            <h2 id="home-income-heading">Income</h2>
            <p className="income-total">{formatPrice(income.totalIncome)}</p>
            <p className="hint">
              From {income.transactionCount}{' '}
              {income.transactionCount === 1 ? 'transaction' : 'transactions'}.
            </p>
            <p className="footer-link" style={{ marginTop: '0.75rem' }}>
              <Link className="inline-action" to="/dashboard">
                Open full dashboard
              </Link>
            </p>
          </section>
        ) : null}

        {!error ? (
          <section className="manage-section" aria-labelledby="home-incoming-heading">
            <h2 id="home-incoming-heading">Incoming bookings</h2>
            <BookingPreviewList
              rows={bookings}
              emptyContent={
                <>
                  <p>No bookings on your gigs yet.</p>
                  <p className="home-cta-row">
                    <Link className="primary-action-link" to="/my-gigs">
                      Publish a gig
                    </Link>
                  </p>
                </>
              }
            />
          </section>
        ) : null}

        {!error && bookings.length > 0 ? (
          <p className="home-cta-row">
            <Link className="primary-action-link" to="/my-gigs">
              Create a gig
            </Link>
          </p>
        ) : null}
      </LoadingRegion>
    </main>
  );
}

function AdminHome() {
  return (
    <main id="main-content" className="page" tabIndex={-1}>
      <h1>Home</h1>
      <p className="lede">You are signed in as an admin. Browse the public catalog anytime.</p>
      <p className="home-cta-row">
        <Link className="primary-action-link" to="/gigs">
          Browse gigs
        </Link>
      </p>
    </main>
  );
}

function HomePage() {
  useDocumentTitle('Home');
  const { isAuthenticated, role } = useAuth();

  let body = <GuestHome />;
  if (isAuthenticated && role === 'client') {
    body = <ClientHome />;
  } else if (isAuthenticated && role === 'freelancer') {
    body = <FreelancerHome />;
  } else if (isAuthenticated && role === 'admin') {
    body = <AdminHome />;
  } else if (isAuthenticated) {
    body = (
      <main id="main-content" className="page" tabIndex={-1}>
        <h1>Home</h1>
        <p className="lede">Signed in. Choose a destination from the navigation.</p>
        <p className="home-cta-row">
          <Link className="primary-action-link" to="/gigs">
            Browse gigs
          </Link>
        </p>
      </main>
    );
  }

  return (
    <>
      <AppNav />
      {body}
    </>
  );
}

export default HomePage;
