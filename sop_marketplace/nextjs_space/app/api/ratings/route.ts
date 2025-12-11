
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/ratings - Create or update rating
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { sopId, rating, review } = body;

    // Validation
    if (!sopId) {
      return NextResponse.json(
        { error: "sopId is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
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

    // Check if user is the author (authors cannot rate their own SOPs)
    if (sop.authorId === user.id) {
      return NextResponse.json(
        { error: "You cannot rate your own SOP" },
        { status: 403 }
      );
    }

    // Check if user purchased this SOP (for paid SOPs)
    if (sop.price > 0) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          sopId: sopId,
          status: "completed",
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "You must purchase this SOP before rating it" },
          { status: 403 }
        );
      }
    }

    // Check if user already rated this SOP
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_sopId: {
          userId: user.id,
          sopId: sopId,
        },
      },
    });

    let ratingRecord;

    if (existingRating) {
      // Update existing rating
      ratingRecord = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating: parseInt(rating.toString()),
          review: review || null,
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
    } else {
      // Create new rating
      ratingRecord = await prisma.rating.create({
        data: {
          userId: user.id,
          sopId: sopId,
          rating: parseInt(rating.toString()),
          review: review || null,
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
    }

    return NextResponse.json(ratingRecord, { status: existingRating ? 200 : 201 });
  } catch (error: any) {
    console.error("Error creating/updating rating:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create/update rating" },
      { status: 500 }
    );
  }
}

// GET /api/ratings - Get ratings for a SOP
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sopId = searchParams.get("sopId");

    if (!sopId) {
      return NextResponse.json(
        { error: "sopId is required" },
        { status: 400 }
      );
    }

    const ratings = await prisma.rating.findMany({
      where: { sopId },
      orderBy: { createdAt: "desc" },
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

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return NextResponse.json({
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
    });
  } catch (error: any) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}
