import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/http';
import { useAuth } from '../auth/AuthContext';

const INITIAL_FORM = {
  email: '',
  password: '',
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
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
            value={form.email}
            onChange={handleChange}
          />
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
            value={form.password}
            onChange={handleChange}
          />
        </label>

        {error ? (
          <p className="message message-error" role="alert">
            {error}
          </p>
        ) : null}

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
