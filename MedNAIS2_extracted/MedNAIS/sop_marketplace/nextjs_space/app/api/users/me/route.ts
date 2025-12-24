
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/users/me - Get current user
export async function GET() {
  try {
    const user = await requireAuth();

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(fullUser);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unauthorized" },
      { status: 401 }
    );
  }
}

// PATCH /api/users/me - Update current user
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { name, bio, role, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        role: role !== undefined ? role : undefined,
        image: image !== undefined ? image : undefined,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/me - Delete current user account
export async function DELETE() {
  try {
    const user = await requireAuth();

    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
