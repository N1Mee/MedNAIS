import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  twitter: z.string().max(100).optional().nullable(),
  linkedin: z.string().max(100).optional().nullable(),
  github: z.string().max(100).optional().nullable(),
});

// GET /api/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        bio: true,
        location: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sops: true,
            purchasedSOPs: true,
            ratings: true,
            executions: true,
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        location: validatedData.location,
        website: validatedData.website || null,
        twitter: validatedData.twitter,
        linkedin: validatedData.linkedin,
        github: validatedData.github,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        bio: true,
        location: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sops: true,
            purchasedSOPs: true,
            ratings: true,
            executions: true,
          }
        }
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
