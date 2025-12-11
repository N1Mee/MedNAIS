import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/auth/email';
import { MagicLinkRequestSchema } from '@/lib/auth/validation';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = MagicLinkRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store magic link in database
    await prisma.magicLink.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Send email with magic link
    await sendMagicLinkEmail(email, token);

    // In dev mode (no SMTP), return the link for testing
    const isDev = !process.env.SMTP_USER || !process.env.SMTP_PASSWORD;
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        message: 'Magic link generated (dev mode)',
        devMode: true,
        magicLink: `${process.env.NEXTAUTH_URL}/auth/magic?token=${token}`,
      });
    }

    // Always return 200 for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists, a sign-in link has been sent to your email.',
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}
