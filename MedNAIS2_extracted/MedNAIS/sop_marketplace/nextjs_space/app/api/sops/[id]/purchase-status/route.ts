import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/sops/[id]/purchase-status - Check if current user has purchased this SOP
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { hasPurchased: false },
        { status: 200 }
      );
    }

    const sopId = params.id;

    // Check if user has completed purchase for this SOP
    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        sopId: sopId,
        status: "completed",
      },
    });

    return NextResponse.json({
      hasPurchased: !!purchase,
    });
  } catch (error) {
    console.error("Error checking purchase status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
