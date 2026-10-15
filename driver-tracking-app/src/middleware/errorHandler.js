import ApiError from "../utils/ApiError.js";

/**
 * Catches unmatched routes and forwards a 404 ApiError.
 */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Normalizes Mongoose/JWT errors into
 * clean, user-facing messages and never leaks internal stack traces.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists.`;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token.";
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    console.error(err);
    message = "Something went wrong on our end. Please try again.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

export default { notFound, errorHandler };
