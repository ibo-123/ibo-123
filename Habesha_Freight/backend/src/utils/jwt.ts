import jwt from 'jsonwebtoken';

export interface UserPayload {
  userId: string;
  role: 'SHIPPER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';
  phoneNumber?: string;
  email?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default_fallback_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT access token for authenticated users
 */
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Verifies and decodes a signed JWT token
 */
export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}
