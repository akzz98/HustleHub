import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function HomePage() {
  const { isAuthenticated, role, logout } = useAuth();

  return (
    <main className="page">
      <h1>HustleHub+</h1>
      <p className="lede">Freelance marketplace — browse gigs, book work, track income.</p>

      {isAuthenticated ? (
        <>
          <p className="message message-success" role="status">
            Signed in as <strong>{role || 'user'}</strong>. Token is in sessionStorage for this
            tab.
          </p>
          <p className="footer-link">
            <button type="button" className="linkish" onClick={logout}>
              Sign out
            </button>
          </p>
        </>
      ) : (
        <p className="footer-link">
          <Link to="/login">Sign in</Link>
          {' · '}
          <Link to="/register">Create an account</Link>
        </p>
      )}
    </main>
  );
}

export default HomePage;
