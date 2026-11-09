# HustleHub+ API image.
# MongoDB URI, JWT secret, TLS paths, and CLIENT_ORIGIN come from the environment.
# Mount certificate files at runtime — do not bake secrets or certs into the image.

FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
