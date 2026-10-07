import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <main className="page">
      <h1>HustleHub+</h1>
      <p className="lede">Freelance marketplace — browse gigs, book work, track income.</p>
      <p className="footer-link">
        <Link to="/register">Create an account</Link>
      </p>
    </main>
  );
}

export default HomePage;
