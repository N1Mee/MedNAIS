import { NextResponse } from 'next/server';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(response: NextResponse, token: string): void {
  // Determine if we're in a secure context (HTTPS)
  // Use NEXTAUTH_URL to check if the app is served over HTTPS
  const isSecureContext = process.env.NEXTAUTH_URL?.startsWith('https://') || false;
  
  const cookieConfig = {
    name: REFRESH_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: isSecureContext,
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
  
  console.log('🍪 Setting refresh token cookie:', {
    name: cookieConfig.name,
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    maxAge: cookieConfig.maxAge,
    path: cookieConfig.path,
    tokenLength: token.length,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });
  
  response.cookies.set(cookieConfig);
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(response: NextResponse): void {
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Get refresh token from request
 */
export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const match = cookies.match(new RegExp(`${REFRESH_TOKEN_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
