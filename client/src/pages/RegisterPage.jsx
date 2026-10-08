import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/http';
import { FieldError, StatusMessage } from '../components/StatusMessage';
import { hasFieldErrors, validateRegistrationForm } from '../utils/formValidation';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'client',
};

function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
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
    setSuccess(null);

    const nextFieldErrors = validateRegistrationForm(form);
    setFieldErrors(nextFieldErrors);
    if (hasFieldErrors(nextFieldErrors)) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      const user = await registerUser(form);
      setSuccess(user);
      setForm(INITIAL_FORM);
      setFieldErrors({});
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
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            value={form.name}
            onChange={handleChange}
          />
          <FieldError id="name-error" message={fieldErrors.name} />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
            value={form.password}
            onChange={handleChange}
          />
          <span id="password-hint" className="hint">
            8–128 characters with uppercase, lowercase, a number, and a special character.
          </span>
          <FieldError id="password-error" message={fieldErrors.password} />
        </label>

        <fieldset aria-invalid={Boolean(fieldErrors.role)}>
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
          <FieldError id="role-error" message={fieldErrors.role} />
        </fieldset>

        <StatusMessage type="error">{error}</StatusMessage>
        <StatusMessage type="success">
          {success
            ? `Account created for ${success.name} (${success.email}). You can sign in next.`
            : null}
        </StatusMessage>

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
