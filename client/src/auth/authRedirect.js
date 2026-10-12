let redirectHandler = null;

function setAuthRedirectHandler(handler) {
  redirectHandler = typeof handler === 'function' ? handler : null;
}

function redirectToLogin({ from, reason } = {}) {
  if (!redirectHandler) {
    return;
  }
  redirectHandler({ from, reason });
}

function buildLoginPath({ from, reason, email } = {}) {
  const params = new URLSearchParams();
  if (from && from !== '/login' && from !== '/register') {
    params.set('from', from);
  }
  if (reason) {
    params.set('reason', reason);
  }
  if (email) {
    params.set('email', email);
  }
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
}

function defaultPathForRole(role) {
  if (role === 'freelancer') {
    return '/dashboard';
  }
  if (role === 'client') {
    return '/gigs';
  }
  return '/';
}

export {
  setAuthRedirectHandler,
  redirectToLogin,
  buildLoginPath,
  defaultPathForRole,
};
