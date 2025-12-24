
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const execution = await prisma.sOPExecution.findUnique({
      where: { id: params.id },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            description: true,
            creatorId: true
          }
        },
        stepExecutions: {
          include: {
            step: {
              select: {
                id: true,
                order: true,
                title: true,
                description: true,
                question: true
              }
            }
          },
          orderBy: {
            completedAt: 'asc'
          }
        }
      }
    });

    if (!execution) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (execution.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the execution
    const execution = await prisma.sOPExecution.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        status: true
      }
    });

    if (!execution) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify ownership
    if (execution.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete step executions first (cascade should handle this, but being explicit)
    await prisma.stepExecution.deleteMany({
      where: { executionId: params.id }
    });

    // Delete the execution
    await prisma.sOPExecution.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
