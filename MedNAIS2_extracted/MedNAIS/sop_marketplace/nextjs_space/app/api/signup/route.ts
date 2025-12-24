
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Пароль обязателен" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 4 символа" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user (unverified)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role === "seller" ? "seller" : "buyer",
        verificationToken,
        emailVerified: null, // Not verified yet
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name || "Пользователь",
        verificationToken,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Clean up user if email fails
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: "Не удалось отправить письмо для верификации. Пожалуйста, попробуйте снова." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Пользователь создан успешно. Проверьте ваш email для подтверждения аккаунта.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Не удалось создать пользователя" },
      { status: 500 }
    );
  }
}
