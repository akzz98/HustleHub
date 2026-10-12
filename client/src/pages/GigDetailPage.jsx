import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBooking, getGig } from '../api/http';
import { useAuth } from '../auth/AuthContext';
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

function GigDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, role, userId } = useAuth();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setGig(null);
    setBookingResult(null);
    setBookingError('');
    setAwaitingConfirm(false);
    try {
      const data = await getGig(id);
      setGig(data);
    } catch (err) {
      setError(err.message || 'Could not load this gig.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmBook() {
    setBookingError('');
    setBooking(true);

    try {
      const result = await createBooking(id);
      setBookingResult(result);
      setAwaitingConfirm(false);
    } catch (err) {
      setBookingError(err.message || 'Could not create booking.');
    } finally {
      setBooking(false);
    }
  }

  const isOwnGig =
    isAuthenticated && role === 'freelancer' && gig && String(gig.freelancerId) === String(userId);
  const canBook = isAuthenticated && role === 'client' && !isOwnGig;

  return (
    <>
      <AppNav />
      <main className="page page-wide">
        <p className="footer-link" style={{ marginTop: 0 }}>
          <Link to="/gigs">← All gigs</Link>
        </p>

        <LoadingRegion loading={loading} label="Loading gig…">
          <StatusMessage type="error">{error}</StatusMessage>

          {error ? (
            <p className="home-cta-row">
              <button type="button" className="primary-action" onClick={load}>
                Retry
              </button>
            </p>
          ) : null}

          {gig ? (
            <article>
              <h1>{gig.title}</h1>
              <p className="gig-price-detail">{formatPrice(gig.price)}</p>
              <p className="lede">{gig.description}</p>

              <section className="booking-panel" aria-labelledby="book-heading">
                <h2 id="book-heading">{isOwnGig ? 'Your listing' : 'Book this gig'}</h2>

                {isOwnGig ? (
                  <p className="home-cta-row">
                    <Link className="primary-action-link" to="/my-gigs">
                      Edit this gig
                    </Link>
                  </p>
                ) : null}

                {!isOwnGig && !isAuthenticated ? (
                  <p>
                    <Link to="/login">Sign in</Link> as a client to book.
                  </p>
                ) : null}

                {!isOwnGig && isAuthenticated && role !== 'client' ? (
                  <p className="hint">Only client accounts can place bookings.</p>
                ) : null}

                {canBook && !bookingResult ? (
                  <>
                    <p className="hint demo-checkout-note">
                      Checkout is a demo. No card is charged — payment is simulated when you
                      confirm.
                    </p>

                    {!awaitingConfirm ? (
                      <button
                        type="button"
                        className="primary-action"
                        onClick={() => {
                          setBookingError('');
                          setAwaitingConfirm(true);
                        }}
                        disabled={booking}
                      >
                        Book for {formatPrice(gig.price)}
                      </button>
                    ) : (
                      <div className="booking-confirm">
                        <p>
                          Confirm booking for <strong>{formatPrice(gig.price)}</strong>? This
                          creates a demo payment record.
                        </p>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="primary-action"
                            onClick={handleConfirmBook}
                            disabled={booking}
                          >
                            {booking ? 'Booking…' : 'Confirm booking'}
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => setAwaitingConfirm(false)}
                            disabled={booking}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                <StatusMessage type="error">{bookingError}</StatusMessage>

                {bookingResult ? (
                  <div className="message message-success" role="status">
                    <p>{formatBookingStatus(bookingResult.status)}</p>
                    {bookingResult.transaction ? (
                      <p>
                        Simulated payment of {formatPrice(bookingResult.transaction.amount)}{' '}
                        (transaction {bookingResult.transaction.id}).
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
        </LoadingRegion>
      </main>
    </>
  );
}

export default GigDetailPage;
