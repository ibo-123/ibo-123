const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(404, 'Route not found'));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, 'body')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON',
    });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Too many files'
          : 'Invalid file upload';

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err.code === 11000) {
    const message = err.keyPattern && err.keyPattern.email
      ? 'A user with that email already exists'
      : 'That record already exists';

    return res.status(409).json({
      success: false,
      message,
    });
  }

  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : err.message || 'Request failed',
  });
}

module.exports = { notFound, errorHandler };
