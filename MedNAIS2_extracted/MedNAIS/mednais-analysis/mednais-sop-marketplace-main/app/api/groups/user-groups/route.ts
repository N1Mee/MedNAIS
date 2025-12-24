
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userGroups = await prisma.groupMembership.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    const groups = userGroups.map(membership => membership.group);

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get user groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
