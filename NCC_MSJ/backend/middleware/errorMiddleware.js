// @desc    Log error to console
const logError = (err, req) => {
  console.error("Error:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id,
    errorName: err.name,
    errorMessage: err.message,
    errorStack: err.stack,
    requestBody: req.body,
    requestParams: req.params,
    requestQuery: req.query
  });
};

// @desc    Log error to audit log
const logErrorToAudit = async (err, req) => {
  try {
    const AuditLog = require("../models/AuditLog.model");
    
    await AuditLog.log({
      userId: req.user?.id,
      action: req.method,
      resource: req.path,
      resourceName: "Error occurred",
      status: "failure",
      errorMessage: err.message,
      errorStack: err.stack,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
  } catch (auditError) {
    console.error("Failed to log error to audit:", auditError);
  }
};

// @desc    Handle Mongoose errors
const handleMongooseError = (err) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error = {
      message,
      statusCode: 404,
      name: "NotFoundError"
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    error = {
      message,
      statusCode: 400,
      name: "DuplicateError"
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Validation failed: ${messages.join(". ")}`;
    error = {
      message,
      statusCode: 400,
      name: "ValidationError",
      errors: messages
    };
  }

  return error;
};

// @desc    Handle JWT errors
const handleJWTError = (err) => {
  let error = { ...err };

  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Invalid token",
      statusCode: 401,
      name: "UnauthorizedError"
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Token has expired",
      statusCode: 401,
      name: "UnauthorizedError"
    };
  }

  return error;
};

// @desc    Handle multer errors
const handleMulterError = (err) => {
  let error = { ...err };

  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "File too large",
      statusCode: 400,
      name: "FileTooLargeError"
    };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    error = {
      message: "Too many files",
      statusCode: 400,
      name: "TooManyFilesError"
    };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = {
      message: "Unexpected file field",
      statusCode: 400,
      name: "UnexpectedFileError"
    };
  }

  return error;
};

// @desc    Main error handler middleware
exports.errorHandler = async (err, req, res, next) => {
  // Log error
  logError(err, req);

  // Log to audit log (async, don't await)
  logErrorToAudit(err, req).catch(console.error);

  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === "CastError" || err.code === 11000 || err.name === "ValidationError") {
    error = handleMongooseError(err);
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    error = handleJWTError(err);
  }

  if (err.code && err.code.startsWith("LIMIT_")) {
    error = handleMulterError(err);
  }

  // Default status code
  error.statusCode = error.statusCode || 500;

  // Default message for server errors
  if (error.statusCode === 500) {
    error.message = "Server Error";
    error.name = "ServerError";
  }

  // Response based on environment
  const response = {
    success: false,
    message: error.message,
    error: error.name || "Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: error.errors
    })
  };

  // Remove stack from production
  if (process.env.NODE_ENV !== "development") {
    delete response.stack;
  }

  res.status(error.statusCode).json(response);
};

// @desc    Async handler to avoid try-catch blocks
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// @desc    404 Not Found handler
exports.notFound = (req, res, next) => {
  const error = {
    message: `Cannot ${req.method} ${req.originalUrl}`,
    statusCode: 404,
    name: "NotFoundError"
  };
  
  next(error);
};

// @desc    Handle unhandled promise rejections
exports.handleUnhandledRejection = () => {
  process.on("unhandledRejection", (err, promise) => {
    console.error("Unhandled Rejection at:", promise);
    console.error("Reason:", err);
    
    // Close server & exit process
    process.exit(1);
  });
};

// @desc    Handle uncaught exceptions
exports.handleUncaughtException = () => {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    
    // Close server & exit process
    process.exit(1);
  });
};