
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/sessions/[id]/steps - Create or update session step
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { stepId, timeSpent, answer, completed } = body;

    // Check if session exists and user owns it
    const session = await prisma.sOPSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own sessions" },
        { status: 403 }
      );
    }

    // Check if step exists in this SOP
    const step = await prisma.step.findFirst({
      where: {
        id: stepId,
        sopId: session.sopId,
      },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Step not found in this SOP" },
        { status: 404 }
      );
    }

    // Check if session step already exists
    const existingSessionStep = await prisma.sessionStep.findFirst({
      where: {
        sessionId: params.id,
        stepId: stepId,
      },
    });

    let sessionStep;

    if (existingSessionStep) {
      // Update existing
      sessionStep = await prisma.sessionStep.update({
        where: { id: existingSessionStep.id },
        data: {
          timeSpent: timeSpent !== undefined ? parseInt(timeSpent.toString()) : existingSessionStep.timeSpent,
          answer: answer !== undefined ? answer : existingSessionStep.answer,
          completedAt: completed && !existingSessionStep.completedAt ? new Date() : existingSessionStep.completedAt,
        },
      });
    } else {
      // Create new
      sessionStep = await prisma.sessionStep.create({
        data: {
          sessionId: params.id,
          stepId: stepId,
          timeSpent: timeSpent ? parseInt(timeSpent.toString()) : 0,
          answer: answer || null,
          completedAt: completed ? new Date() : null,
        },
      });
    }

    // Update session total duration
    const allSessionSteps = await prisma.sessionStep.findMany({
      where: { sessionId: params.id },
    });

    const totalDuration = allSessionSteps.reduce(
      (sum, step) => sum + step.timeSpent,
      0
    );

    await prisma.sOPSession.update({
      where: { id: params.id },
      data: { totalDuration },
    });

    return NextResponse.json(sessionStep);
  } catch (error: any) {
    console.error("Error creating/updating session step:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create/update session step" },
      { status: 500 }
    );
  }
}
