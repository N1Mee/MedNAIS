
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

// GET /api/categories/suggestions - Get all category suggestions (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check in production

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
