import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGigs } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import AppNav from '../components/AppNav';
import LoadingRegion from '../components/LoadingRegion';
import { StatusMessage } from '../components/StatusMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';

const EXCERPT_LENGTH = 140;

const SORT_OPTIONS = [
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function excerpt(text, maxLength = EXCERPT_LENGTH) {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function compareGigs(a, b, sort) {
  switch (sort) {
    case 'title-desc':
      return String(b.title || '').localeCompare(String(a.title || ''), undefined, {
        sensitivity: 'base',
      });
    case 'price-asc':
      return Number(a.price) - Number(b.price);
    case 'price-desc':
      return Number(b.price) - Number(a.price);
    case 'title-asc':
    default:
      return String(a.title || '').localeCompare(String(b.title || ''), undefined, {
        sensitivity: 'base',
      });
  }
}

function filterGigs(gigs, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return gigs;
  }

  return gigs.filter((gig) => {
    const title = String(gig.title || '').toLowerCase();
    const description = String(gig.description || '').toLowerCase();
    return title.includes(needle) || description.includes(needle);
  });
}

function GigsPage() {
  useDocumentTitle('Browse gigs');
  const { isAuthenticated, role } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('title-asc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listGigs();
      setGigs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load gigs.');
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterGigs(gigs, query);
  const visible = [...filtered].sort((a, b) => compareGigs(a, b, sort));
  const hasQuery = query.trim().length > 0;
  const catalogEmpty = !loading && !error && gigs.length === 0;
  const noMatches = !loading && !error && gigs.length > 0 && visible.length === 0;

  function matchLabel() {
    if (loading || error || gigs.length === 0) {
      return null;
    }
    if (hasQuery) {
      return `${visible.length} of ${gigs.length} ${gigs.length === 1 ? 'gig' : 'gigs'} match`;
    }
    return `${gigs.length} ${gigs.length === 1 ? 'gig' : 'gigs'}`;
  }

  return (
    <>
      <AppNav />
      <main id="main-content" className="page page-catalog ui-sans" tabIndex={-1}>
        <h1>Browse gigs</h1>
        <p className="lede">Public listings from freelancers. Open a gig for full details.</p>

        {!loading && !error && gigs.length > 0 ? (
          <div className="catalog-toolbar">
            <label className="catalog-search" htmlFor="gig-search">
              Search
              <input
                id="gig-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title or description"
                autoComplete="off"
              />
            </label>
            <label className="catalog-sort" htmlFor="gig-sort">
              Sort
              <select
                id="gig-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {matchLabel() ? (
          <p className="catalog-count" role="status">
            {matchLabel()}
          </p>
        ) : null}

        <LoadingRegion loading={loading} label="Loading gigs…">
          <StatusMessage type="error">{error}</StatusMessage>

          {error ? (
            <p className="home-cta-row">
              <button type="button" className="primary-action" onClick={load}>
                Retry
              </button>
            </p>
          ) : null}

          {catalogEmpty ? (
            <>
              <p>No gigs yet. Freelancers can publish listings after signing in.</p>
              <p className="home-cta-row">
                {isAuthenticated && role === 'freelancer' ? (
                  <Link className="primary-action-link" to="/my-gigs">
                    Publish a gig
                  </Link>
                ) : (
                  <Link className="primary-action-link" to="/register">
                    Register to publish
                  </Link>
                )}
              </p>
            </>
          ) : null}

          {noMatches ? (
            <>
              <p>No gigs match that search.</p>
              <p className="home-cta-row">
                <button type="button" className="primary-action" onClick={() => setQuery('')}>
                  Clear search
                </button>
              </p>
            </>
          ) : null}

          {!error && visible.length > 0 ? (
            <ul className="gig-list">
              {visible.map((gig) => (
                <li key={gig.id}>
                  <Link to={`/gigs/${gig.id}`} className="gig-list-item">
                    <span className="gig-list-copy">
                      <span className="gig-title">{gig.title}</span>
                      {gig.description ? (
                        <span className="gig-excerpt">{excerpt(gig.description)}</span>
                      ) : null}
                    </span>
                    <span className="gig-price">{formatPrice(gig.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </LoadingRegion>
      </main>
    </>
  );
}

export default GigsPage;
