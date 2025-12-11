
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/sessions/[id] - Get single session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const session = await prisma.sOPSession.findUnique({
      where: { id: params.id },
      include: {
        sop: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        sessionSteps: {
          include: {
            step: true,
          },
          orderBy: {
            step: {
              order: "asc",
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if user owns this session
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only view your own sessions" },
        { status: 403 }
      );
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { status, totalDuration } = body;

    // Check if session exists and user owns it
    const existingSession = await prisma.sOPSession.findUnique({
      where: { id: params.id },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (existingSession.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own sessions" },
        { status: 403 }
      );
    }

    // Update session
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "completed" && !existingSession.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    if (totalDuration !== undefined) {
      updateData.totalDuration = parseInt(totalDuration.toString());
    }

    const session = await prisma.sOPSession.update({
      where: { id: params.id },
      data: updateData,
      include: {
        sop: {
          select: {
            id: true,
            title: true,
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

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update session" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Check if session exists and user owns it
    const existingSession = await prisma.sOPSession.findUnique({
      where: { id: params.id },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (existingSession.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own sessions" },
        { status: 403 }
      );
    }

    // Delete session (cascade will delete session steps)
    await prisma.sOPSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Session deleted successfully" 
    });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
