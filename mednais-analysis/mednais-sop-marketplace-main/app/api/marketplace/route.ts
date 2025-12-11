
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const categoryId = searchParams.get('categoryId');
    const sortBy = searchParams.get('sortBy') || 'newest';

    let whereClause: any = {
      type: 'MARKETPLACE'
    };

    // Category filter
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Price filters
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price.gte = parseInt(minPrice) * 100; // Convert to cents
      }
      if (maxPrice) {
        whereClause.price.lte = parseInt(maxPrice) * 100; // Convert to cents
      }
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first
    
    switch (sortBy) {
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { executions: { _count: 'desc' } };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
    }

    const sops = await prisma.sOP.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        steps: {
          select: { id: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            executions: true,
            purchases: true
          }
        }
      },
      orderBy
    });

    return NextResponse.json(sops);
  } catch (error) {
    console.error("Get marketplace SOPs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace SOPs" },
      { status: 500 }
    );
  }
}
