import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, email, name, avatar_url, password } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`ℹ️ User already exists: ${email}`);
      return NextResponse.json({ 
        success: true,
        isExisting: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          avatar_url: existingUser.avatar_url,
        }
      });
    }

    // Хешируем пароль, если он предоставлен
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Создаем нового пользователя
    const user = await prisma.user.create({
      data: {
        email,
        name,
        avatar_url,
        password: hashedPassword,
      },
    });

    console.log(`✅ New user created via ${provider}:`, user.email);

    return NextResponse.json({ 
      success: true,
      isExisting: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }
    });
  } catch (error) {
    console.error('Error in test login:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
