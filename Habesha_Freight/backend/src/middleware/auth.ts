import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface UserPayload {
  userId: string;
  role: string;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_fallback_jwt_secret') as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: { code: 'INVALID_TOKEN' },
    });
  }
}

// Helper to check if user is authenticated
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.user;
}

// Helper to get user ID
export function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.userId;
}

// Helper to get user role
export function getUserRole(req: AuthenticatedRequest): string | undefined {
  return req.user?.role;
}
