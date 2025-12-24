import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAccessToken, hashToken, verifyToken } from '@/lib/auth/jwt';
import { getRefreshTokenFromRequest } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = getRefreshTokenFromRequest(request);
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify token format
    const payload = verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if token exists in database and is not revoked
    const hashedToken = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    if (storedToken.revokedAt) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.email!
    );

    return NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        avatar_url: storedToken.user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
