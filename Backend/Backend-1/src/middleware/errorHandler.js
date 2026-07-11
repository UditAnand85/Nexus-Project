/**
 * Global Error Handler & Custom AppError class.
 *
 * Usage in controllers/services:
 *   throw new AppError('Not found', 404);
 *
 * The errorHandler middleware is registered LAST in app.js.
 */

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx / 5xx)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from unexpected system errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express global error handling middleware.
 * Must have 4 parameters to be recognized as an error handler by Express.
 *
 * @param {AppError|Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  console.error(
    `[${new Date().toISOString()}] ❌  ${req.method} ${req.originalUrl} → ${statusCode} ${message}`
  );

  if (!err.isOperational && process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
