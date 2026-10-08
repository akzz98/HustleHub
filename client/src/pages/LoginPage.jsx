import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { FieldError, StatusMessage } from '../components/StatusMessage';
import { hasFieldErrors, validateLoginForm } from '../utils/formValidation';

const INITIAL_FORM = {
  email: '',
  password: '',
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
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
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <h1>Sign in</h1>
      <p className="lede">
        Access token is kept in <code>sessionStorage</code> for this tab only
        (cleared when the tab closes). See <code>src/auth/tokenStorage.js</code>{' '}
        for the storage tradeoffs.
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

        <label htmlFor="password">
          Password
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            value={form.password}
            onChange={handleChange}
          />
          <FieldError id="password-error" message={fieldErrors.password} />
        </label>

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
  );
}

export default LoginPage;
