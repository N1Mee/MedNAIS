
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stepExecutions, totalTimeSeconds } = await req.json();

    if (!stepExecutions || !Array.isArray(stepExecutions)) {
      return NextResponse.json({ error: "Step executions are required" }, { status: 400 });
    }

    // Verify execution exists and belongs to user
    const execution = await prisma.sOPExecution.findUnique({
      where: { id: params.id },
      include: { sop: { include: { steps: true } } }
    });

    if (!execution) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    if (execution.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update execution as completed
    const updatedExecution = await prisma.sOPExecution.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalTimeSeconds,
        stepExecutions: {
          create: stepExecutions.map((step: any) => ({
            stepId: step.stepId,
            timeSeconds: step.timeSeconds,
            answer: step.answer !== undefined ? step.answer : null
          }))
        }
      },
      include: {
        stepExecutions: true
      }
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error("Complete execution error:", error);
    return NextResponse.json(
      { error: "Failed to complete execution" },
      { status: 500 }
    );
  }
}
