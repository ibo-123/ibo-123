import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hashes a raw password string securely using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plain password against a stored bcrypt hash
 */
export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(plain, hashed);
}

/**
 * Generates a 6-digit cryptographically secure One-Time Password (OTP)
 */
export function generateOTP(): { otp: string; expiresAt: Date } {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return { otp, expiresAt };
}

/**
 * SHA-256 hash for shipment pickup/delivery OTPs (must match shipmentController verify).
 */
export function hashOtpSha256(otp: string): string {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Generates a 6-digit OTP and its SHA-256 hash for shipment handover.
 */
export function generateOtpAndHash(): { otp: string; hash: string } {
  const otp = crypto.randomInt(100000, 999999).toString();
  return { otp, hash: hashOtpSha256(otp) };
}
