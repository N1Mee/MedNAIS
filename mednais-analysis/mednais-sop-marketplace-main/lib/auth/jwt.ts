import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'access',
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      type: 'refresh',
    } as JWTPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Hash token for storage (using simple hash for refresh tokens)
 */
export function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
