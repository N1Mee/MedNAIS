
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

    const executions = await prisma.sOPExecution.findMany({
      where: {
        userId: user.id
      },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        stepExecutions: {
          orderBy: {
            completedAt: 'asc'
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
