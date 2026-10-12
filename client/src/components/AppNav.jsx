import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function AppNav() {
  const { isAuthenticated, role, name, logout } = useAuth();

  return (
    <nav className="app-nav" aria-label="Main">
      <Link to="/" className="brand">
        HustleHub+
      </Link>
      <div className="app-nav-links">
        <Link to="/gigs">Browse gigs</Link>
        {isAuthenticated && role === 'freelancer' ? (
          <>
            <Link to="/my-gigs">My gigs</Link>
            <Link to="/dashboard">Dashboard</Link>
          </>
        ) : null}
        {isAuthenticated && role === 'client' ? (
          <Link to="/my-bookings">My bookings</Link>
        ) : null}
        {isAuthenticated && role === 'admin' ? (
          <>
            <Link to="/admin/users">Users</Link>
            <Link to="/admin/gigs">Gigs</Link>
            <Link to="/admin/bookings">Bookings</Link>
            <Link to="/admin/transactions">Transactions</Link>
          </>
        ) : null}
        {isAuthenticated ? (
          <>
            <span className="nav-user">
              {name ? <span className="nav-name">{name}</span> : null}
              <span className="nav-meta">{role}</span>
            </span>
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
