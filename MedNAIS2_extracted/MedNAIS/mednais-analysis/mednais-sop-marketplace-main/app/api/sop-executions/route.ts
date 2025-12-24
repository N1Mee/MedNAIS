
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        ...(user.name && { name: user.name }),
        ...(user.email && { email: user.email }),
      },
      create: {
        id: user.id,
        name: user.name || null,
        email: user.email || '',
      },
    });

    const { sopId } = await req.json();

    if (!sopId) {
      return NextResponse.json({ error: "SOP ID is required" }, { status: 400 });
    }

    // Verify SOP exists and user has access
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
      include: { group: true }
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (sop.creatorId === dbUser.id) {
      hasAccess = true;
    } else if (sop.type === 'PERSONAL') {
      hasAccess = false;
    } else if (sop.type === 'GROUP' && sop.groupId) {
      const membership = await prisma.groupMembership.findFirst({
        where: {
          groupId: sop.groupId,
          userId: dbUser.id,
          status: 'APPROVED'
        }
      });
      hasAccess = !!membership;
    } else if (sop.type === 'MARKETPLACE') {
      const purchase = await prisma.purchase.findFirst({
        where: {
          sopId,
          buyerId: dbUser.id
        }
      });
      hasAccess = !!purchase || sop.creatorId === dbUser.id;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create execution record
    const execution = await prisma.sOPExecution.create({
      data: {
        userId: dbUser.id,
        sopId,
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error("Start execution error:", error);
    return NextResponse.json(
      { error: "Failed to start execution" },
      { status: 500 }
    );
  }
}
