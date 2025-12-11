
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/s3";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSOPSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(['PERSONAL', 'GROUP', 'MARKETPLACE']),
  price: z.number().positive().optional(),
  groupId: z.string().optional(),
  categoryId: z.string().optional(),
  steps: z.array(z.object({
    order: z.number().positive(),
    title: z.string().min(1, "Step title is required"),
    description: z.string().min(1, "Step description is required"),
    imageId: z.string().optional(),
    youtubeUrl: z.string().optional(),
    timerSeconds: z.number().positive().optional(),
    references: z.array(z.string()).optional(),
    question: z.string().optional(),
  })).min(1, "At least one step is required")
});

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
        ...(user.avatar_url && { avatar_url: user.avatar_url }),
      },
      create: {
        id: user.id,
        name: user.name || null,
        email: user.email || '',
        avatar_url: user.avatar_url || null,
      },
    });

    const formData = await req.formData();
    const dataStr = formData.get('data') as string;
    if (!dataStr) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const body = JSON.parse(dataStr);
    const validatedData = createSOPSchema.parse(body);

    // Upload images and update steps
    for (let i = 0; i < validatedData.steps.length; i++) {
      const fileKey = `step-${i}-image`;
      const file = formData.get(fileKey) as File;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const cloudStoragePath = await uploadFile(buffer, file.name);
        validatedData.steps[i].imageId = cloudStoragePath;
      }
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
          userId: dbUser.id,
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

    // Create SOP with steps
    const sop = await prisma.sOP.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        price: validatedData.price || null,
        creatorId: dbUser.id,
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

    return NextResponse.json(sop, { status: 201 });
  } catch (error) {
    console.error("Create SOP error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create SOP" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const groupId = searchParams.get('groupId');

    let whereClause: any = {};

    if (type === 'created') {
      whereClause.creatorId = user.id;
    } else if (type === 'purchased') {
      // Get purchased SOPs through purchases table
      const purchases = await prisma.purchase.findMany({
        where: { buyerId: user.id },
        include: {
          sop: {
            include: {
              creator: true,
              steps: {
                orderBy: { order: 'asc' }
              },
              _count: { select: { executions: true } }
            }
          }
        }
      });
      
      return NextResponse.json(purchases.map(p => p.sop));
    } else if (type === 'group' && groupId) {
      // Get group SOPs that user has access to
      const membership = await prisma.groupMembership.findFirst({
        where: {
          groupId,
          userId: user.id,
          status: 'APPROVED'
        }
      });

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      whereClause.groupId = groupId;
    } else {
      // Default: user's created SOPs
      whereClause.creatorId = user.id;
    }

    const sops = await prisma.sOP.findMany({
      where: whereClause,
      include: {
        creator: true,
        group: true,
        steps: {
          orderBy: { order: 'asc' }
        },
        _count: { select: { executions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(sops);
  } catch (error) {
    console.error("Get SOPs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOPs" },
      { status: 500 }
    );
  }
}
