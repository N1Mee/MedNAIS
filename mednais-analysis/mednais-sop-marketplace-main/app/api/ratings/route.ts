import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';

// POST - Create or update a rating
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sopId, rating, comment } = await req.json();

    // Validate rating
    if (!sopId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      );
    }

    // User is already available from getCurrentUser()

    // Get SOP to check if it exists and if user can rate it
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId }
    });

    if (!sop) {
      return NextResponse.json(
        { error: 'SOP not found' },
        { status: 404 }
      );
    }

    // Check if SOP is paid - if yes, user must have purchased it
    if (sop.type === 'MARKETPLACE' && sop.price && sop.price > 0) {
      const purchase = await prisma.purchase.findFirst({
        where: {
          sopId: sopId,
          buyerId: user.id
        }
      });

      if (!purchase) {
        return NextResponse.json(
          { error: 'You must purchase this SOP before rating it' },
          { status: 403 }
        );
      }
    }

    // Create or update rating
    const ratingRecord = await prisma.rating.upsert({
      where: {
        userId_sopId: {
          userId: user.id,
          sopId: sopId
        }
      },
      update: {
        rating: rating,
        comment: comment || null
      },
      create: {
        userId: user.id,
        sopId: sopId,
        rating: rating,
        comment: comment || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Rating saved successfully',
      rating: ratingRecord
    });

  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get ratings for a SOP or user's rating
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sopId = searchParams.get('sopId');
    const userId = searchParams.get('userId');

    if (!sopId && !userId) {
      return NextResponse.json(
        { error: 'sopId or userId is required' },
        { status: 400 }
      );
    }

    if (sopId) {
      // Get all ratings for a SOP
      const ratings = await prisma.rating.findMany({
        where: { sopId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate average
      const average = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return NextResponse.json({
        ratings,
        average: Math.round(average * 10) / 10,
        count: ratings.length
      });
    }

    if (userId) {
      // Get user's rating for a specific SOP
      const rating = await prisma.rating.findFirst({
        where: { userId }
      });

      return NextResponse.json({ rating });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
