import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAppleToken } from '@/lib/auth/oauth';
import { generateAccessToken, generateRefreshToken, hashToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie } from '@/lib/auth/cookies';
import { AppleAuthSchema } from '@/lib/auth/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = AppleAuthSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

    // Verify Apple token
    const applePayload = await verifyAppleToken(idToken);
    if (!applePayload) {
      return NextResponse.json(
        { error: 'Invalid Apple token' },
        { status: 401 }
      );
    }

    const { sub: appleUserId, email } = applePayload;

    // Check if auth provider exists
    let authProvider = await prisma.authProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider: 'apple',
          providerUserId: appleUserId,
        },
      },
      include: { user: true },
    });

    let user;

    if (authProvider) {
      // User exists
      user = authProvider.user;
    } else {
      // Check if user with same email exists (if email is available)
      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Apple to existing user
          await prisma.authProvider.create({
            data: {
              id: uuidv4(),
              userId: user.id,
              provider: 'apple',
              providerUserId: appleUserId,
            },
          });
        }
      }

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: email || undefined,
            name: email ? email.split('@')[0] : 'Apple User',
          },
        });

        // Create auth provider
        await prisma.authProvider.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            provider: 'apple',
            providerUserId: appleUserId,
          },
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email || appleUserId);
    const refreshToken = generateRefreshToken(user.id, user.email || appleUserId);

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
    console.error('Apple auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Apple' },
      { status: 500 }
    );
  }
}
