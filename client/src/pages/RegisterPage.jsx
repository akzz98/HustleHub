import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/http';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'client',
};

function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess(null);
    setSubmitting(true);

    try {
      const user = await registerUser(form);
      setSuccess(user);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <h1>Create account</h1>
      <p className="lede">
        Register as a client or freelancer. Admin accounts cannot be self-registered.
      </p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">
          Name
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            required
            value={form.name}
            onChange={handleChange}
          />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={form.password}
            onChange={handleChange}
          />
          <span className="hint">
            8–128 characters with uppercase, lowercase, a number, and a special character.
          </span>
        </label>

        <fieldset>
          <legend>I am a</legend>
          <label className="choice" htmlFor="role-client">
            <input
              id="role-client"
              type="radio"
              name="role"
              value="client"
              checked={form.role === 'client'}
              onChange={handleChange}
            />
            Client
          </label>
          <label className="choice" htmlFor="role-freelancer">
            <input
              id="role-freelancer"
              type="radio"
              name="role"
              value="freelancer"
              checked={form.role === 'freelancer'}
              onChange={handleChange}
            />
            Freelancer
          </label>
        </fieldset>

        {error ? (
          <p className="message message-error" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="message message-success" role="status">
            Account created for {success.name} ({success.email}). You can sign in next.
          </p>
        ) : null}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Register'}
        </button>
      </form>

      <p className="footer-link">
        Already registered? <Link to="/login">Sign in</Link>
        {' · '}
        <Link to="/">Home</Link>
      </p>
    </main>
  );
}

export default RegisterPage;
