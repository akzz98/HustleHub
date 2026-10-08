import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createGig, deleteGig, listGigs, updateGig } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import AppNav from '../components/AppNav';

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
};

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function ManageGigsPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const [myGigs, setMyGigs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await listGigs();
      const mine = (Array.isArray(all) ? all : []).filter(
        (gig) => gig.freelancerId === userId
      );
      setMyGigs(mine);
    } catch (err) {
      setError(err.message || 'Could not load your gigs.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && role === 'freelancer') {
      loadMine();
    }
  }, [isAuthenticated, role, loadMine]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'freelancer') {
    return (
      <>
        <AppNav />
        <main className="page">
          <h1>Manage gigs</h1>
          <p className="message message-error" role="alert">
            Only freelancer accounts can create and manage gigs.
          </p>
          <p className="footer-link">
            <Link to="/gigs">Browse gigs</Link>
          </p>
        </main>
      </>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEdit(gig) {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      price: String(gig.price),
    });
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    const price = Number(form.price);
    const payload = {
      title: form.title,
      description: form.description,
      price,
    };

    try {
      if (editingId) {
        await updateGig(editingId, payload);
        setNotice('Gig updated.');
      } else {
        await createGig(payload);
        setNotice('Gig created.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadMine();
    } catch (err) {
      setError(err.message || 'Could not save gig.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(gig) {
    const confirmed = window.confirm(`Delete “${gig.title}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError('');
    setNotice('');
    try {
      await deleteGig(gig.id);
      if (editingId === gig.id) {
        cancelEdit();
      }
      setNotice('Gig deleted.');
      await loadMine();
    } catch (err) {
      setError(err.message || 'Could not delete gig.');
    }
  }

  return (
    <>
      <AppNav />
      <main className="page page-wide">
        <h1>Manage your gigs</h1>
        <p className="lede">
          Create, update, or remove listings you own. Ownership is taken from your JWT — not from
          the form.
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <h2 className="form-heading">{editingId ? 'Edit gig' : 'New gig'}</h2>

          <label htmlFor="title">
            Title
            <input
              id="title"
              name="title"
              type="text"
              maxLength={120}
              required
              value={form.title}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              required
              value={form.description}
              onChange={handleChange}
            />
          </label>

          <label htmlFor="price">
            Price (USD)
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
            />
          </label>

          {error ? (
            <p className="message message-error" role="alert">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="message message-success" role="status">
              {notice}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create gig'}
            </button>
            {editingId ? (
              <button type="button" className="button-secondary" onClick={cancelEdit}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <section className="manage-section" aria-labelledby="my-gigs-heading">
          <h2 id="my-gigs-heading">Your listings</h2>
          {loading ? <p>Loading…</p> : null}
          {!loading && myGigs.length === 0 ? <p>You have not published any gigs yet.</p> : null}
          {!loading && myGigs.length > 0 ? (
            <ul className="gig-list">
              {myGigs.map((gig) => (
                <li key={gig.id} className="manage-gig-row">
                  <div>
                    <Link to={`/gigs/${gig.id}`} className="gig-title">
                      {gig.title}
                    </Link>
                    <div className="gig-price">{formatPrice(gig.price)}</div>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="linkish" onClick={() => startEdit(gig)}>
                      Edit
                    </button>
                    <button type="button" className="linkish" onClick={() => handleDelete(gig)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </main>
    </>
  );
}

export default ManageGigsPage;
