const AppError = require('../utils/AppError');

// Express error middleware — four args so Express treats this as an error handler
function errorHandler(err, req, res, next) {
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
