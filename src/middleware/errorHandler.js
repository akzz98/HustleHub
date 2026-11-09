const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

function isMalformedJson(err) {
  // express.json() puts status 400 and a body property on SyntaxError
  return err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body');
}

// Express error middleware — four args so Express treats this as an error handler
function errorHandler(err, req, res, next) {
  if (isMalformedJson(err)) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Log details for operators only — the client always gets a generic 500 body.
  logger.error(
    {
      event: 'server_error',
      errName: err.name,
      errMessage: err.message,
      method: req.method,
      path: req.path,
    },
    'unexpected server error'
  );

  return res.status(500).json({
    error: 'An internal server error occurred.',
  });
}

module.exports = {
  errorHandler,
};
