class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // errors threw on purpose (400/401/409)
  }
}

module.exports = AppError;
