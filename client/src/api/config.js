// Empty string = same origin (Vite proxy in dev). Set VITE_API_URL for a direct API host.
const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export { apiBaseUrl };
