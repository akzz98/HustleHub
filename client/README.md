# HustleHub+ client

Vite + React frontend for the HustleHub+ API.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Local `npm run dev` proxies `/api` to `VITE_API_PROXY_TARGET` (default `https://localhost:3000`).
Leave `VITE_API_URL` empty so the browser uses that proxy.
