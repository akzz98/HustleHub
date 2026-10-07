import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGigs } from '../api/http';
import AppNav from '../components/AppNav';

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function GigsPage() {
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await listGigs();
        if (!cancelled) {
          setGigs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load gigs.');
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
    <>
      <AppNav />
      <main className="page page-wide">
        <h1>Browse gigs</h1>
        <p className="lede">Public listings from freelancers. Open a gig for full details.</p>

        {loading ? <p>Loading gigs…</p> : null}

        {error ? (
          <p className="message message-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && gigs.length === 0 ? (
          <p>No gigs yet. Freelancers can publish listings after signing in.</p>
        ) : null}

        {!loading && gigs.length > 0 ? (
          <ul className="gig-list">
            {gigs.map((gig) => (
              <li key={gig.id}>
                <Link to={`/gigs/${gig.id}`} className="gig-list-item">
                  <span className="gig-title">{gig.title}</span>
                  <span className="gig-price">{formatPrice(gig.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </>
  );
}

export default GigsPage;
