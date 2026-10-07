import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function AppNav() {
  const { isAuthenticated, role, logout } = useAuth();

  return (
    <nav className="app-nav" aria-label="Main">
      <Link to="/" className="brand">
        HustleHub+
      </Link>
      <div className="app-nav-links">
        <Link to="/gigs">Browse gigs</Link>
        {isAuthenticated ? (
          <>
            <span className="nav-meta">{role}</span>
            <button type="button" className="linkish" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default AppNav;
