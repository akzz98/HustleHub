import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { defaultPathForRole } from '../auth/authRedirect';
import { readTokenPayload } from '../auth/tokenStorage';
import AppNav from '../components/AppNav';
import PasswordField from '../components/PasswordField';
import { FieldError, StatusMessage } from '../components/StatusMessage';
import { hasFieldErrors, validateLoginForm } from '../utils/formValidation';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const fromParam = searchParams.get('from');
  const fromState = location.state?.from;
  const returnTo =
    (typeof fromParam === 'string' && fromParam.startsWith('/') && fromParam) ||
    (typeof fromState === 'string' && fromState.startsWith('/') && fromState) ||
    null;
  const reason = searchParams.get('reason');
  const emailPrefill = searchParams.get('email') || '';

  const [form, setForm] = useState({
    email: emailPrefill,
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(
    reason === 'expired' ? 'Your session expired. Please sign in again.' : ''
  );
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const nextFieldErrors = validateLoginForm(form);
    setFieldErrors(nextFieldErrors);
    if (hasFieldErrors(nextFieldErrors)) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      const { token } = await loginUser(form);
      login(token);
      const payload = readTokenPayload(token);
      const destination = returnTo || defaultPathForRole(payload?.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppNav />
      <main className="page">
        <h1>Sign in</h1>
        <p className="lede">
          Sign in to browse, book, or manage gigs. You stay signed in on this tab until you close it
          or sign out.
        </p>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              value={form.email}
              onChange={handleChange}
            />
            <FieldError id="email-error" message={fieldErrors.email} />
          </label>

          <PasswordField
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.password)}
            errorId={fieldErrors.password ? 'password-error' : undefined}
            errorMessage={fieldErrors.password}
          />

          <StatusMessage type="error">{error}</StatusMessage>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="footer-link">
          No account? <Link to="/register">Register</Link>
          {' · '}
          <Link to="/">Home</Link>
        </p>
      </main>
    </>
  );
}

export default LoginPage;
