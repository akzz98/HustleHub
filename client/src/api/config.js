// Vite only exposes env vars prefixed with VITE_
const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (!apiBaseUrl) {
  // Fail early in the console so missing .env is obvious during development.
  console.warn('VITE_API_URL is not set. Copy client/.env.example to client/.env');
}

export { apiBaseUrl };
