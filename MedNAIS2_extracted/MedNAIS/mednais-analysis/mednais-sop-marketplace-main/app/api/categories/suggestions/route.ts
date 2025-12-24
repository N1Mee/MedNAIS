
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
// Auth handled by requireAdmin
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/categories/suggestions - Get all category suggestions (admin only)
export async function GET() {
  try {
    // Only admins can view category suggestions
    const adminCheck = await requireAdmin();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error }, 
        { status: adminCheck.status }
      );
    }

    const suggestions = await prisma.categorySuggestion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching category suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
