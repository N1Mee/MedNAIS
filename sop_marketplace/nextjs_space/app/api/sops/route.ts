
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/sops - List SOPs with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const visibility = searchParams.get("visibility");
    const authorId = searchParams.get("authorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: any = {};

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by author
    if (authorId) {
      where.authorId = authorId;
    }

    // Filter by visibility
    if (visibility) {
      where.visibility = visibility;
    } else {
      // By default, only show public SOPs for non-authenticated users
      where.visibility = "public";
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-low") {
      orderBy = { price: "asc" };
    } else if (sort === "price-high") {
      orderBy = { price: "desc" };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [sops, total] = await Promise.all([
      prisma.sOP.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          category: true,
          steps: {
            orderBy: { order: "asc" },
            take: 1,
          },
          _count: {
            select: { steps: true },
          },
        },
      }),
      prisma.sOP.count({ where }),
    ]);

    return NextResponse.json({
      sops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching SOPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch SOPs" },
      { status: 500 }
    );
  }
}

// POST /api/sops - Create new SOP
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "seller") {
      return NextResponse.json(
        { error: "Only sellers can create SOPs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, price, imageUrl, attachments, categoryId, visibility, steps } = body;

    // Validation
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create SOP with steps
    const sop = await prisma.sOP.create({
      data: {
        title,
        description: description || null,
        price: parseFloat(price || 0),
        imageUrl: imageUrl || null,
        attachments: attachments || null,
        categoryId: categoryId || null,
        visibility: visibility || "public",
        authorId: user.id,
        steps: {
          create:
            steps?.map((step: any, index: number) => ({
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
            })) || [],
        },
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

    return NextResponse.json(sop, { status: 201 });
  } catch (error: any) {
    console.error("Error creating SOP:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create SOP" },
      { status: 500 }
    );
  }
}
