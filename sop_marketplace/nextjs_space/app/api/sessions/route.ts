
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/sessions - Start a new SOP session
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { sopId } = body;

    if (!sopId) {
      return NextResponse.json(
        { error: "sopId is required" },
        { status: 400 }
      );
    }

    // Check if SOP exists
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sop) {
      return NextResponse.json(
        { error: "SOP not found" },
        { status: 404 }
      );
    }

    // Check if user has access (free SOP or purchased)
    if (sop.price > 0 && sop.authorId !== user.id) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: user.id,
          sopId: sopId,
          status: "completed",
        },
      });

      if (!purchase) {
        return NextResponse.json(
          { error: "You need to purchase this SOP first" },
          { status: 403 }
        );
      }
    }

    // Create session
    const session = await prisma.sOPSession.create({
      data: {
        userId: user.id,
        sopId: sopId,
        status: "in_progress",
        totalDuration: 0,
      },
      include: {
        sop: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

// GET /api/sessions - Get user's sessions
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const sopId = searchParams.get("sopId");
    const status = searchParams.get("status");

    const where: any = {
      userId: user.id,
    };

    if (sopId) {
      where.sopId = sopId;
    }

    if (status) {
      where.status = status;
    }

    const sessions = await prisma.sOPSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        sessionSteps: {
          include: {
            step: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
