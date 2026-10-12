import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import AppNav from '../../components/AppNav';
import { StatusMessage } from '../../components/StatusMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getAdminResource } from './adminResources';

function AdminDetailPage() {
  const { resourceKey, id } = useParams();
  const resource = getAdminResource(resourceKey);
  useDocumentTitle(resource ? `${resource.singular}` : 'Admin');
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resource || !id) {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setItem(null);
      try {
        const data = await resource.get(id);
        if (!cancelled) {
          setItem(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || `Could not load this ${resource.singular.toLowerCase()}.`);
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
  }, [resource, id]);

  if (!resource) {
    return <Navigate to="/" replace />;
  }

  const fields = item ? resource.detailFields(item) : [];

  return (
    <>
      <AppNav />
      <main id="main-content" className="page page-wide ui-sans" tabIndex={-1}>
        <p className="footer-link" style={{ marginTop: 0 }}>
          <Link className="back-link" to={resource.listPath}>
            All {resource.title.toLowerCase()}
          </Link>
        </p>

        <h1>{resource.singular}</h1>
        <p className="lede">Read-only detail. There is no edit or delete action on this page.</p>

        {loading ? <p>Loading…</p> : null}
        <StatusMessage type="error">{error}</StatusMessage>

        {!loading && item ? (
          <dl className="admin-detail">
            {fields.map((field) => (
              <div key={field.label} className="admin-detail-row">
                <dt>{field.label}</dt>
                <dd>{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </main>
    </>
  );
}

export default AdminDetailPage;
