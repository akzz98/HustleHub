import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function linkClass({ isActive }) {
  return isActive ? 'is-current' : undefined;
}

function AppNav() {
  const { isAuthenticated, role, name, logout } = useAuth();

  return (
    <nav className="app-nav" aria-label="Main">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'brand is-current' : 'brand')} end>
        HustleHub+
      </NavLink>
      <div className="app-nav-links">
        <NavLink to="/gigs" className={linkClass}>
          Browse gigs
        </NavLink>
        {isAuthenticated && role === 'freelancer' ? (
          <>
            <NavLink to="/my-gigs" className={linkClass}>
              My gigs
            </NavLink>
            <NavLink to="/dashboard" className={linkClass} end>
              Dashboard
            </NavLink>
          </>
        ) : null}
        {isAuthenticated && role === 'client' ? (
          <NavLink to="/my-bookings" className={linkClass} end>
            My bookings
          </NavLink>
        ) : null}
        {isAuthenticated && role === 'admin' ? (
          <>
            <NavLink to="/admin/users" className={linkClass}>
              Users
            </NavLink>
            <NavLink to="/admin/gigs" className={linkClass}>
              Gigs
            </NavLink>
            <NavLink to="/admin/bookings" className={linkClass}>
              Bookings
            </NavLink>
            <NavLink to="/admin/transactions" className={linkClass}>
              Transactions
            </NavLink>
          </>
        ) : null}
        {isAuthenticated ? (
          <>
            <span className="nav-user">
              {name ? <span className="nav-name">{name}</span> : null}
              <span className="nav-meta">{role}</span>
            </span>
            <button type="button" className="nav-signout" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? 'nav-signin is-current' : 'nav-signin')}
              end
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) => (isActive ? 'nav-register is-current' : 'nav-register')}
              end
            >
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default AppNav;
