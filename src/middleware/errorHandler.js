const AppError = require('../utils/AppError');

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

  console.error(err);

  return res.status(500).json({
    error: 'An internal server error occurred.',
  });
}

module.exports = {
  errorHandler,
};
