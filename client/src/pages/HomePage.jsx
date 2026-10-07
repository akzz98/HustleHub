import { Link } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { useAuth } from '../auth/AuthContext';

function HomePage() {
  const { isAuthenticated, role } = useAuth();

  return (
    <>
      <AppNav />
      <main className="page">
        <h1>HustleHub+</h1>
        <p className="lede">Freelance marketplace — browse gigs, book work, track income.</p>

        {isAuthenticated ? (
          <p className="message message-success" role="status">
            Signed in as <strong>{role || 'user'}</strong>.
          </p>
        ) : null}

        <p className="footer-link">
          <Link to="/gigs">Browse gigs</Link>
        </p>
      </main>
    </>
  );
}

export default HomePage;
