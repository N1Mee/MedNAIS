
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/users/[id]/stats - Get user statistics
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user with their SOPs
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        sops: {
          where: { visibility: "public" },
          include: {
            ratings: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                comments: true,
                purchases: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalSOPs = user.sops.length;
    
    // Calculate average rating across all author's SOPs
    let totalRatings = 0;
    let sumRatings = 0;
    
    user.sops.forEach((sop) => {
      sop.ratings.forEach((rating) => {
        sumRatings += rating.rating;
        totalRatings++;
      });
    });

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Calculate total purchases
    const totalPurchases = user.sops.reduce(
      (sum, sop) => sum + sop._count.purchases,
      0
    );

    // Calculate total comments
    const totalComments = user.sops.reduce(
      (sum, sop) => sum + sop._count.comments,
      0
    );

    return NextResponse.json({
      userId: user.id,
      userName: user.name,
      totalSOPs,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      totalPurchases,
      totalComments,
    });
  } catch (error: any) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
