import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import AppNav from '../../components/AppNav';
import { StatusMessage } from '../../components/StatusMessage';
import { getAdminResource } from './adminResources';

function AdminListPage() {
  const { resourceKey } = useParams();
  const resource = getAdminResource(resourceKey);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resource) {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await resource.list();
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || `Could not load ${resource.title.toLowerCase()}.`);
          setRows([]);
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
  }, [resource]);

  if (!resource) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <AppNav />
      <main className="page page-catalog">
        <h1>{resource.title}</h1>
        <p className="lede">
          Read-only admin oversight. Open a row for details. Nothing can be created, edited, or
          deleted here.
        </p>

        {loading ? <p>Loading…</p> : null}
        <StatusMessage type="error">{error}</StatusMessage>

        {!loading && !error && rows.length === 0 ? <p>{resource.emptyMessage}</p> : null}

        {!loading && !error && rows.length > 0 ? (
          <ul className="gig-list">
            {rows.map((item) => (
              <li key={item.id}>
                <Link to={`${resource.listPath}/${item.id}`} className="gig-list-item">
                  <span className="gig-list-copy">
                    <span className="gig-title">{resource.listLabel(item)}</span>
                    <span className="gig-excerpt">{resource.listHint(item)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </>
  );
}

export default AdminListPage;
