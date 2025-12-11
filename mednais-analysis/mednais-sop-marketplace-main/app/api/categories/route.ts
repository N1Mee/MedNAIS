
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

// GET /api/categories - Get all categories with hierarchy
export async function GET() {
  try {
    // Get only parent categories with their subcategories
    const parentCategories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { sops: true }
            }
          }
        },
        _count: {
          select: { sops: true }
        }
      }
    });

    return NextResponse.json(parentCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories - Create a new category (admin only) or suggest a category
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isSuggestion } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // If this is a suggestion, create a CategorySuggestion
    if (isSuggestion) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const suggestion = await prisma.categorySuggestion.create({
        data: {
          name,
          description,
          userId: dbUser.id,
        }
      });

      return NextResponse.json({ 
        message: 'Category suggestion submitted successfully',
        suggestion 
      }, { status: 201 });
    }

    // TODO: In production, add admin check here
    // For now, any authenticated user can create categories
    
    const category = await prisma.category.create({
      data: {
        name,
        description,
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
