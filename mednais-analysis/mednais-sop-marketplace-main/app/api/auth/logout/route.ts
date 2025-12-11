import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken } from '@/lib/auth/jwt';
import { clearRefreshTokenCookie, getRefreshTokenFromRequest } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = getRefreshTokenFromRequest(request);
    
    if (refreshToken) {
      // Revoke token in database
      const hashedToken = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          token: hashedToken,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    clearRefreshTokenCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
