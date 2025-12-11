
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/comments - Create a comment
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { sopId, content } = body;

    // Validation
    if (!sopId) {
      return NextResponse.json(
        { error: "sopId is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Content must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // Check if SOP exists
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
    });

    if (!sop) {
      return NextResponse.json(
        { error: "SOP not found" },
        { status: 404 }
      );
    }

    // Check if user can comment (must purchase for paid SOPs, unless they're the author)
    const isAuthor = sop.authorId === user.id;
    if (!isAuthor && sop.price > 0) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          sopId: sopId,
          status: "completed",
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "You must purchase this SOP before commenting" },
          { status: 403 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        sopId: sopId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET /api/comments - Get comments for a SOP
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sopId = searchParams.get("sopId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!sopId) {
      return NextResponse.json(
        { error: "sopId is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { sopId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.comment.count({ where: { sopId } }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
