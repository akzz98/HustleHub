import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBooking, getGig } from '../api/http';
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

function GigDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, role } = useAuth();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setGig(null);
      setBookingResult(null);
      setBookingError('');
      try {
        const data = await getGig(id);
        if (!cancelled) {
          setGig(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load this gig.');
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
  }, [id]);

  async function handleBook() {
    setBookingError('');
    setBookingResult(null);
    setBooking(true);

    try {
      const result = await createBooking(id);
      setBookingResult(result);
    } catch (err) {
      setBookingError(err.message || 'Could not create booking.');
    } finally {
      setBooking(false);
    }
  }

  return (
    <>
      <AppNav />
      <main className="page page-wide">
        <p className="footer-link" style={{ marginTop: 0 }}>
          <Link to="/gigs">← All gigs</Link>
        </p>

        {loading ? <p>Loading…</p> : null}

        <StatusMessage type="error">{error}</StatusMessage>

        {gig ? (
          <article>
            <h1>{gig.title}</h1>
            <p className="gig-price-detail">{formatPrice(gig.price)}</p>
            <p className="lede">{gig.description}</p>

            <section className="booking-panel" aria-labelledby="book-heading">
              <h2 id="book-heading">Book this gig</h2>

              {!isAuthenticated ? (
                <p>
                  <Link to="/login">Sign in</Link> as a client to book.
                </p>
              ) : null}

              {isAuthenticated && role !== 'client' ? (
                <p className="hint">Only client accounts can place bookings.</p>
              ) : null}

              {isAuthenticated && role === 'client' ? (
                <button type="button" className="primary-action" onClick={handleBook} disabled={booking}>
                  {booking ? 'Booking…' : `Book for ${formatPrice(gig.price)}`}
                </button>
              ) : null}

              <StatusMessage type="error">{bookingError}</StatusMessage>

              {bookingResult ? (
                <div className="message message-success" role="status">
                  <p>
                    Booking <strong>{bookingResult.status}</strong>
                    {bookingResult.confirmation?.message
                      ? ` — ${bookingResult.confirmation.message}`
                      : '.'}
                  </p>
                  {bookingResult.transaction ? (
                    <p>
                      Simulated payment recorded:{' '}
                      {formatPrice(bookingResult.transaction.amount)} (transaction{' '}
                      {bookingResult.transaction.id}).
                    </p>
                  ) : null}
                  <p>
                    <Link to="/my-bookings">View my bookings</Link>
                  </p>
                </div>
              ) : null}
            </section>
          </article>
        ) : null}
      </main>
    </>
  );
}

export default GigDetailPage;
