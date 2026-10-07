import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGig } from '../api/http';
import AppNav from '../components/AppNav';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function GigDetailPage() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setGig(null);
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

  return (
    <>
      <AppNav />
      <main className="page page-wide">
        <p className="footer-link" style={{ marginTop: 0 }}>
          <Link to="/gigs">← All gigs</Link>
        </p>

        {loading ? <p>Loading…</p> : null}

        {error ? (
          <p className="message message-error" role="alert">
            {error}
          </p>
        ) : null}

        {gig ? (
          <article>
            <h1>{gig.title}</h1>
            <p className="gig-price-detail">{formatPrice(gig.price)}</p>
            <p className="lede">{gig.description}</p>
          </article>
        ) : null}
      </main>
    </>
  );
}

export default GigDetailPage;
