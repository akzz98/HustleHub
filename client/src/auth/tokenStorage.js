/**
 * Token storage strategy (STEP 8.3)
 *
 * The API returns a JWT in JSON (`{ token }`). The browser must then send it
 * on protected routes. Options and tradeoffs:
 *
 * - httpOnly cookie (set by the server): best against XSS theft, but this API
 *   returns the token in the body today; switching would need backend cookie
 *   work (CSRF protection, SameSite, etc.) and is out of Part 2 scope.
 * - localStorage: survives tab close / browser restart — convenient, but any
 *   XSS can read the token for as long as it lives there.
 * - sessionStorage: cleared when the tab/window closes — still readable by XSS
 *   while the tab is open, but reduces leftover tokens on shared machines.
 * - In-memory only: strongest of the client-side options against persistence,
 *   but a refresh logs the user out.
 *
 * Choice: sessionStorage — balances SPA usability with a shorter lifetime than
 * localStorage. Treat XSS prevention (CSP, sanitisation) as mandatory either way.
 */

const TOKEN_KEY = 'hustlehub_access_token';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Decode JWT payload for UI only — never trust this for authorization decisions.
function readTokenPayload(token = getToken()) {
  if (!token) {
    return null;
  }

  try {
    const [, payloadPart] = token.split('.');
    if (!payloadPart) {
      return null;
    }

    const normalised = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalised);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export { getToken, setToken, clearToken, readTokenPayload };
