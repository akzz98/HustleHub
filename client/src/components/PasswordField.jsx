import { useState } from 'react';
import { FieldError } from './StatusMessage';

function PasswordField({
  id = 'password',
  name = 'password',
  label = 'Password',
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  maxLength = 128,
  required = true,
  invalid = false,
  errorId,
  errorMessage,
  describedBy,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  const descriptionIds = [describedBy, errorId, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <label htmlFor={id} className="password-field">
      {label}
      <span className="password-input-row">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          aria-invalid={invalid}
          aria-describedby={descriptionIds}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'} password
        </button>
      </span>
      {hint ? (
        <span id={`${id}-hint`} className="hint">
          {hint}
        </span>
      ) : null}
      <FieldError id={errorId} message={errorMessage} />
    </label>
  );
}

export default PasswordField;
