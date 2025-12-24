import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Токен верификации не найден" },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Недействительный токен верификации" },
        { status: 400 }
      );
    }

    // Get the base URL for redirect
    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/auth/signin?message=already-verified", baseUrl)
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear token after verification
      },
    });

    // Redirect to sign in page with success message
    return NextResponse.redirect(
      new URL("/auth/signin?message=verified", baseUrl)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Ошибка верификации email" },
      { status: 500 }
    );
  }
}
