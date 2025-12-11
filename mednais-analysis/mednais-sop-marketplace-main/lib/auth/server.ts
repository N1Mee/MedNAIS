import { cookies } from 'next/headers';
import { verifyToken, hashToken } from './jwt';
import { prisma } from '@/lib/db';

/**
 * Get current user from server-side request
 * Use this in server components and API routes
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      console.log('❌ No refresh token in cookie');
      return null;
    }

    // Verify JWT format is valid
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      console.log('❌ Invalid refresh token format');
      return null;
    }

    // Check if token exists in database and is not revoked
    const hashedToken = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      console.log('❌ Refresh token not found in database');
      return null;
    }

    if (storedToken.revokedAt) {
      console.log('❌ Refresh token has been revoked');
      return null;
    }

    console.log('✅ User authenticated:', storedToken.user.email);

    // Return user with correct field mapping
    return {
      id: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      avatar_url: storedToken.user.avatar_url,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - redirect to /auth if not logged in
 * Use this in server components that require auth
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  return user;
}
