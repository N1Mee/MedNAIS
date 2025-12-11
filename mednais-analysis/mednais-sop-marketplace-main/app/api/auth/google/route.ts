import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { generateAccessToken, generateRefreshToken, hashToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie } from '@/lib/auth/cookies';
import { GoogleAuthSchema } from '@/lib/auth/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = GoogleAuthSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

    // Verify Google token
    const googlePayload = await verifyGoogleToken(idToken);
    if (!googlePayload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const { sub: googleUserId, email, name, picture } = googlePayload;

    // Check if auth provider exists
    let authProvider = await prisma.authProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'google',
          providerUserId: googleUserId,
        },
      },
      include: { user: true },
    });

    let user;

    if (authProvider) {
      // User exists, get their info
      user = authProvider.user;
    } else {
      // Check if user with same email exists
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link Google to existing user
        await prisma.authProvider.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            provider: 'google',
            providerUserId: googleUserId,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            email,
            name,
            avatar_url: picture,
          },
        });

        // Create auth provider
        await prisma.authProvider.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            provider: 'google',
            providerUserId: googleUserId,
          },
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email!);
    const refreshToken = generateRefreshToken(user.id, user.email!);

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

    // Store refresh token (delete old ones for this user first to avoid conflicts)
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
    });

    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: hashToken(refreshToken),
        userAgent,
        ip,
      },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
      },
    });

    setRefreshTokenCookie(response, refreshToken);

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
