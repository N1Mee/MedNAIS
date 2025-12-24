import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/profile/avatar - Upload avatar image
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${user.id}-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update user avatar_url in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        avatar_url: true,
      }
    });

    return NextResponse.json({
      success: true,
      avatar_url: updatedUser.avatar_url,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user avatar_url to null
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar_url: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
