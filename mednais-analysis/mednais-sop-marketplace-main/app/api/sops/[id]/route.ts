
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getKey } from "@/lib/s3";

export const dynamic = "force-dynamic";

const updateSOPSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(['PERSONAL', 'GROUP', 'MARKETPLACE']),
  price: z.number().positive().nullable().optional(),
  groupId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  steps: z.array(z.object({
    id: z.string().optional(),
    order: z.number().positive(),
    title: z.string().min(1, "Step title is required"),
    description: z.string().min(1, "Step description is required"),
    imageId: z.string().nullable().optional(),
    youtubeUrl: z.string().nullable().optional(),
    timerSeconds: z.number().positive().nullable().optional(),
    references: z.array(z.string()).nullable().optional(),
    question: z.string().nullable().optional(),
  })).min(1, "At least one step is required")
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sop = await prisma.sOP.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
        group: true,
        steps: {
          orderBy: { order: 'asc' }
        },
        category: true,
      }
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    return NextResponse.json(sop);
  } catch (error) {
    console.error("Get SOP error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOP" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSOPSchema.parse(body);

    // Check if user is the creator
    const existingSOP = await prisma.sOP.findUnique({
      where: { id: params.id },
      include: { steps: true }
    });

    if (!existingSOP) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    if (existingSOP.creatorId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this SOP" },
        { status: 403 }
      );
    }

    // Additional validation
    if (validatedData.type === 'MARKETPLACE' && !validatedData.price) {
      return NextResponse.json(
        { error: "Price is required for marketplace SOPs" },
        { status: 400 }
      );
    }

    if (validatedData.type === 'GROUP' && !validatedData.groupId) {
      return NextResponse.json(
        { error: "Group ID is required for group SOPs" },
        { status: 400 }
      );
    }

    // Verify group membership if it's a group SOP
    if (validatedData.type === 'GROUP' && validatedData.groupId) {
      const membership = await prisma.groupMembership.findFirst({
        where: {
          groupId: validatedData.groupId,
          userId: user.id,
          status: 'APPROVED'
        }
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this group" },
          { status: 403 }
        );
      }
    }

    // Delete existing steps
    await prisma.sOPStep.deleteMany({
      where: { sopId: params.id }
    });

    // Update SOP with new steps
    const updatedSOP = await prisma.sOP.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        price: validatedData.price || null,
        groupId: validatedData.groupId || null,
        categoryId: validatedData.categoryId || null,
        steps: {
          create: validatedData.steps.map(step => ({
            order: step.order,
            title: step.title,
            description: step.description,
            imageId: step.imageId || null,
            youtubeUrl: step.youtubeUrl || null,
            timerSeconds: step.timerSeconds || null,
            references: step.references ? JSON.stringify(step.references) : null,
            question: step.question || null,
          }))
        }
      },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedSOP);
  } catch (error) {
    console.error("Update SOP error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update SOP" },
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

    // Check if user is the creator
    const existingSOP = await prisma.sOP.findUnique({
      where: { id: params.id }
    });

    if (!existingSOP) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    if (existingSOP.creatorId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this SOP" },
        { status: 403 }
      );
    }

    // Delete SOP (cascade will handle steps, executions, purchases)
    await prisma.sOP.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete SOP error:", error);
    return NextResponse.json(
      { error: "Failed to delete SOP" },
      { status: 500 }
    );
  }
}
