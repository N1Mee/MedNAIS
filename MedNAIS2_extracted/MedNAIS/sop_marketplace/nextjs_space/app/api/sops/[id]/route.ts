
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/sops/[id] - Get single SOP
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sop = await prisma.sOP.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
          },
        },
        category: true,
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    return NextResponse.json(sop);
  } catch (error) {
    console.error("Error fetching SOP:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOP" },
      { status: 500 }
    );
  }
}

// PATCH /api/sops/[id] - Update SOP
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Check if SOP exists and user owns it
    const existingSop = await prisma.sOP.findUnique({
      where: { id: params.id },
    });

    if (!existingSop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    if (existingSop.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own SOPs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, price, imageUrl, attachments, categoryId, visibility, steps } = body;

    // Update SOP
    const sop = await prisma.sOP.update({
      where: { id: params.id },
      data: {
        title: title || existingSop.title,
        description: description !== undefined ? description : existingSop.description,
        price: price !== undefined ? parseFloat(price) : existingSop.price,
        imageUrl: imageUrl !== undefined ? imageUrl : existingSop.imageUrl,
        attachments: attachments !== undefined ? attachments : existingSop.attachments,
        categoryId: categoryId !== undefined ? categoryId : existingSop.categoryId,
        visibility: visibility || existingSop.visibility,
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Update steps if provided
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await prisma.step.deleteMany({
        where: { sopId: params.id },
      });

      // Create new steps
      await prisma.step.createMany({
        data: steps.map((step: any, index: number) => ({
          sopId: params.id,
          order: index,
          title: step.title || `Step ${index + 1}`,
          description: step.description || null,
          imageUrl: step.imageUrl || null,
          images: step.images || [],
          videoUrl: step.videoUrl || null,
          duration: step.duration ? parseInt(step.duration) : null,
          countdownSeconds: step.countdownSeconds ? parseInt(step.countdownSeconds) : null,
          question: step.question || null,
          questionType: step.questionType || null,
        })),
      });
    }

    // Fetch updated SOP with steps
    const updatedSop = await prisma.sOP.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSop);
  } catch (error: any) {
    console.error("Error updating SOP:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update SOP" },
      { status: 500 }
    );
  }
}

// DELETE /api/sops/[id] - Delete SOP
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Check if SOP exists and user owns it
    const existingSop = await prisma.sOP.findUnique({
      where: { id: params.id },
    });

    if (!existingSop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    if (existingSop.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own SOPs" },
        { status: 403 }
      );
    }

    // Delete SOP (cascade will delete steps)
    await prisma.sOP.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "SOP deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting SOP:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete SOP" },
      { status: 500 }
    );
  }
}
