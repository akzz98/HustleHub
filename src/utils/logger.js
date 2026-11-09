const pino = require('pino');

// Paths that must never appear in plaintext logs.
const REDACT_PATHS = [
  'password',
  'passwordHash',
  'token',
  'authorization',
  'Authorization',
  'JWT_SECRET',
  'MONGODB_URI',
  'ADMIN_SEED_PASSWORD',
  'headers.authorization',
  'headers.Authorization',
  'req.headers.authorization',
  'req.headers.Authorization',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.authorization',
  '*.Authorization',
  '*.JWT_SECRET',
  '*.MONGODB_URI',
];

function resolveLevel(options = {}) {
  if (options.level) {
    return options.level;
  }
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  // Keep Jest output quiet unless a test injects its own destination.
  if (process.env.NODE_ENV === 'test') {
    return 'silent';
  }
  return 'info';
}

function resolveLogtailToken() {
  return String(process.env.LOGTAIL_SOURCE_TOKEN || '').trim();
}

function resolveLogtailEndpoint() {
  return String(process.env.LOGTAIL_INGEST_URL || '').trim();
}

function shouldShipToCloud() {
  return Boolean(resolveLogtailToken()) && process.env.NODE_ENV !== 'test';
}

function createCloudTransport() {
  const sourceToken = resolveLogtailToken();
  if (!sourceToken) {
    return null;
  }

  const logtailOptions = { sourceToken };
  const endpoint = resolveLogtailEndpoint();
  if (endpoint) {
    logtailOptions.options = { endpoint };
  }

  // Same JSON events go to stdout and Better Stack.
  return pino.transport({
    targets: [
      {
        target: 'pino/file',
        options: { destination: 1 },
      },
      {
        target: '@logtail/pino',
        options: logtailOptions,
      },
    ],
  });
}

function createLogger(options = {}) {
  const pinoOptions = {
    level: resolveLevel(options),
    base: { service: 'hustlehub-api' },
    redact: {
      paths: REDACT_PATHS,
      censor: '[Redacted]',
    },
    ...(options.pinoOptions || {}),
  };

  if (options.destination) {
    return pino(pinoOptions, options.destination);
  }

  if (options.enableCloud === true || (options.enableCloud !== false && shouldShipToCloud())) {
    const transport = createCloudTransport();
    if (transport) {
      return pino(pinoOptions, transport);
    }
  }

  return pino(pinoOptions);
}

const logger = createLogger();

module.exports = {
  logger,
  createLogger,
  REDACT_PATHS,
  shouldShipToCloud,
  resolveLogtailToken,
  createCloudTransport,
};
