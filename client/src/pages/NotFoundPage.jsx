import { Link, useLocation } from 'react-router-dom';
import AppNav from '../components/AppNav';

function NotFoundPage() {
  const location = useLocation();
  const triedPath = `${location.pathname}${location.search}` || '/';

  return (
    <>
      <AppNav />
      <main className="page">
        <h1>Page not found</h1>
        <p className="lede">
          Nothing matches <code>{triedPath}</code>. Check the address, or use a link below.
        </p>
        <p className="home-cta-row">
          <Link className="primary-action-link" to="/">
            Home
          </Link>
          <Link className="secondary-action-link" to="/gigs">
            Browse gigs
          </Link>
        </p>
      </main>
    </>
  );
}

export default NotFoundPage;
