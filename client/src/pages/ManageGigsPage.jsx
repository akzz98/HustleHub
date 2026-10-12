import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { createGig, deleteGig, listGigs, updateGig } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { buildLoginPath } from '../auth/authRedirect';
import AppNav from '../components/AppNav';
import LoadingRegion from '../components/LoadingRegion';
import { FieldError, StatusMessage } from '../components/StatusMessage';
import { hasFieldErrors, validateGigForm } from '../utils/formValidation';

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
  const location = useLocation();
  const { isAuthenticated, role, userId } = useAuth();
  const [myGigs, setMyGigs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const all = await listGigs();
      const mine = (Array.isArray(all) ? all : []).filter(
        (gig) => String(gig.freelancerId) === String(userId)
      );
      setMyGigs(mine);
    } catch (err) {
      setMyGigs([]);
      setListError(err.message || 'Could not load your gigs.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  function focusNewGigForm() {
    cancelEdit();
    const titleInput = document.getElementById('title');
    if (titleInput) {
      titleInput.focus();
      titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  useEffect(() => {
    if (isAuthenticated && role === 'freelancer') {
      loadMine();
    }
  }, [isAuthenticated, role, loadMine]);

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
          <h1>Manage gigs</h1>
          <StatusMessage type="error">
            Only freelancer accounts can create and manage gigs.
          </StatusMessage>
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
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function startEdit(gig) {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      price: String(gig.price),
    });
    setFieldErrors({});
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    const nextFieldErrors = validateGigForm(form);
    setFieldErrors(nextFieldErrors);
    if (hasFieldErrors(nextFieldErrors)) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
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
      setFieldErrors({});
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
          Create, update, or remove the gigs you publish. Only your own listings appear here.
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
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
              value={form.title}
              onChange={handleChange}
            />
            <FieldError id="title-error" message={fieldErrors.title} />
          </label>

          <label htmlFor="description">
            Description
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              required
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? 'description-error' : undefined}
              value={form.description}
              onChange={handleChange}
            />
            <FieldError id="description-error" message={fieldErrors.description} />
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
              aria-invalid={Boolean(fieldErrors.price)}
              aria-describedby={fieldErrors.price ? 'price-error' : undefined}
              value={form.price}
              onChange={handleChange}
            />
            <FieldError id="price-error" message={fieldErrors.price} />
          </label>

          <StatusMessage type="error">{error}</StatusMessage>
          <StatusMessage type="success">{notice}</StatusMessage>

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
          <LoadingRegion loading={loading} label="Loading your gigs…">
            <StatusMessage type="error">{listError}</StatusMessage>
            {listError ? (
              <p className="home-cta-row">
                <button type="button" className="primary-action" onClick={loadMine}>
                  Retry
                </button>
              </p>
            ) : null}
            {!listError && myGigs.length === 0 ? (
              <>
                <p>You have not published any gigs yet.</p>
                <p className="home-cta-row">
                  <button type="button" className="primary-action" onClick={focusNewGigForm}>
                    Publish a gig
                  </button>
                </p>
              </>
            ) : null}
            {!listError && myGigs.length > 0 ? (
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
          </LoadingRegion>
        </section>
      </main>
    </>
  );
}

export default ManageGigsPage;
