function StatusMessage({ type = 'error', children }) {
  if (!children) {
    return null;
  }

  const className =
    type === 'success' ? 'message message-success' : 'message message-error';
  const role = type === 'success' ? 'status' : 'alert';

  return (
    <p className={className} role={role}>
      {children}
    </p>
  );
}

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <span id={id} className="field-error" role="alert">
      {message}
    </span>
  );
}

export { StatusMessage, FieldError };
