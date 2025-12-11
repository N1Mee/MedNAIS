import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const { creatorId } = params;

    // Get all SOPs created by this user
    const sops = await prisma.sOP.findMany({
      where: { creatorId },
      select: { id: true }
    });

    if (sops.length === 0) {
      return NextResponse.json({
        average: 0,
        count: 0,
        sopsCount: 0
      });
    }

    const sopIds = sops.map(s => s.id);

    // Get all ratings for these SOPs
    const ratings = await prisma.rating.findMany({
      where: {
        sopId: { in: sopIds }
      },
      select: { rating: true }
    });

    if (ratings.length === 0) {
      return NextResponse.json({
        average: 0,
        count: 0,
        sopsCount: sops.length
      });
    }

    const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    return NextResponse.json({
      average: Math.round(average * 10) / 10,
      count: ratings.length,
      sopsCount: sops.length
    });

  } catch (error) {
    console.error('Error fetching creator rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
