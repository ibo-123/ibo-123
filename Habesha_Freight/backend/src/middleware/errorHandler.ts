import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.name || 'APP_ERROR',
      },
    });
  }

  // Database errors
  if (err.name === 'SequelizeValidationError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'UniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: {
        code: 'DUPLICATE_RESOURCE',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: {
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Default error
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: 'INTERNAL_ERROR',
    },
  });
}