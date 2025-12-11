
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user owns the comment
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}
