import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAccessToken, generateRefreshToken, hashToken } from '@/lib/auth/jwt';
import { setRefreshTokenCookie } from '@/lib/auth/cookies';
import { MagicLinkVerifySchema } from '@/lib/auth/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = MagicLinkVerifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find magic link
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > magicLink.expiresAt) {
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 400 }
      );
    }

    // Check if already used
    if (magicLink.usedAt) {
      return NextResponse.json(
        { error: 'Link has already been used' },
        { status: 400 }
      );
    }

    // Find or create user (using upsert to avoid race conditions)
    const user = await prisma.user.upsert({
      where: { email: magicLink.email },
      update: {},
      create: {
        id: uuidv4(),
        email: magicLink.email,
        name: magicLink.email.split('@')[0],
      },
    });

    // Create or update auth provider
    await prisma.authProvider.upsert({
      where: {
        provider_providerUserId: {
          provider: 'email',
          providerUserId: magicLink.email,
        },
      },
      update: {},
      create: {
        id: uuidv4(),
        userId: user.id,
        provider: 'email',
        providerUserId: magicLink.email,
      },
    });

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

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
    console.error('Magic link verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify magic link' },
      { status: 500 }
    );
  }
}
