import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { createGig, deleteGig, listGigs, updateGig } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { buildLoginPath } from '../auth/authRedirect';
import AppNav from '../components/AppNav';
import LoadingRegion from '../components/LoadingRegion';
import { FieldError, StatusMessage } from '../components/StatusMessage';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { hasFieldErrors, validateGigForm } from '../utils/formValidation';

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
};

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;

function formatPrice(price) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
}

function ManageGigsPage() {
  useDocumentTitle('My gigs');
  const location = useLocation();
  const { isAuthenticated, role, userId } = useAuth();
  const formRef = useRef(null);
  const [myGigs, setMyGigs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  function scrollToForm() {
    const formEl = formRef.current;
    if (!formEl) {
      return;
    }
    if (typeof formEl.scrollIntoView === 'function') {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const titleInput = document.getElementById('title');
    if (titleInput) {
      titleInput.focus();
    }
  }

  function focusNewGigForm() {
    cancelEdit();
    setPendingDeleteId(null);
    scrollToForm();
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
        <main id="main-content" className="page" tabIndex={-1}>
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
    setPendingDeleteId(null);
    setForm({
      title: gig.title,
      description: gig.description,
      price: String(gig.price),
    });
    setFieldErrors({});
    setError('');
    setNotice('');
    // Scroll after paint so the Edit heading is visible.
    requestAnimationFrame(() => {
      scrollToForm();
    });
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

  async function confirmDelete(gig) {
    setError('');
    setNotice('');
    setDeleting(true);
    try {
      await deleteGig(gig.id);
      if (editingId === gig.id) {
        cancelEdit();
      }
      setPendingDeleteId(null);
      setNotice('Gig deleted.');
      await loadMine();
    } catch (err) {
      setError(err.message || 'Could not delete gig.');
    } finally {
      setDeleting(false);
    }
  }

  const titleRemaining = TITLE_MAX - form.title.length;
  const descriptionRemaining = DESCRIPTION_MAX - form.description.length;

  return (
    <>
      <AppNav />
      <main id="main-content" className="page page-wide" tabIndex={-1}>
        <h1>Manage your gigs</h1>
        <p className="lede">
          Create, update, or remove the gigs you publish. Only your own listings appear here.
        </p>

        <form
          ref={formRef}
          id="gig-form"
          className="form form-narrow"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="form-heading">{editingId ? 'Edit gig' : 'New gig'}</h2>

          <div className="field-block">
            <label htmlFor="title">
              Title
              <input
                id="title"
                name="title"
                type="text"
                maxLength={TITLE_MAX}
                required
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={
                  fieldErrors.title ? 'title-error title-count' : 'title-count'
                }
                value={form.title}
                onChange={handleChange}
              />
            </label>
            <span id="title-count" className="char-count">
              {titleRemaining} characters left
            </span>
            <FieldError id="title-error" message={fieldErrors.title} />
          </div>

          <div className="field-block">
            <label htmlFor="description">
              Description
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                required
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description
                    ? 'description-error description-count'
                    : 'description-count'
                }
                value={form.description}
                onChange={handleChange}
              />
            </label>
            <span id="description-count" className="char-count">
              {descriptionRemaining} characters left
            </span>
            <FieldError id="description-error" message={fieldErrors.description} />
          </div>

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
            <button type="submit" disabled={submitting || deleting}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create gig'}
            </button>
            {editingId ? (
              <button type="button" className="button-secondary" onClick={cancelEdit}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <section className="manage-section ui-sans" aria-labelledby="my-gigs-heading">
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
                {myGigs.map((gig) => {
                  const isEditing = editingId === gig.id;
                  const isPendingDelete = pendingDeleteId === gig.id;

                  return (
                    <li
                      key={gig.id}
                      className={`manage-gig-row${isEditing ? ' is-editing' : ''}`}
                    >
                      <div>
                        <Link to={`/gigs/${gig.id}`} className="gig-title">
                          {gig.title}
                        </Link>
                        <div className="gig-price">{formatPrice(gig.price)}</div>
                        {isEditing ? <p className="hint editing-marker">Editing this gig</p> : null}
                        {isPendingDelete ? (
                          <div className="inline-confirm">
                            <p>Delete “{gig.title}”? This cannot be undone.</p>
                            <div className="form-actions">
                              <button
                                type="button"
                                className="primary-action"
                                disabled={deleting}
                                onClick={() => confirmDelete(gig)}
                              >
                                {deleting ? 'Deleting…' : 'Confirm delete'}
                              </button>
                              <button
                                type="button"
                                className="button-secondary"
                                disabled={deleting}
                                onClick={() => setPendingDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {!isPendingDelete ? (
                        <div className="row-actions">
                          <button type="button" className="linkish" onClick={() => startEdit(gig)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="linkish"
                            onClick={() => {
                              setPendingDeleteId(gig.id);
                              setNotice('');
                              setError('');
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </LoadingRegion>
        </section>
      </main>
    </>
  );
}

export default ManageGigsPage;
