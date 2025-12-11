import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/cart - Get user's cart
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            sop: {
              include: {
                creator: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
        include: {
          items: {
            include: {
              sop: {
                include: {
                  creator: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.sop.price || 0);
    }, 0);

    return NextResponse.json({
      cart,
      total,
      itemCount: cart.items.length,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sopId } = await req.json();

    if (!sopId) {
      return NextResponse.json({ error: 'SOP ID is required' }, { status: 400 });
    }

    // Check if SOP exists and is marketplace type
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
    });

    if (!sop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
    }

    if (sop.type !== 'MARKETPLACE') {
      return NextResponse.json(
        { error: 'Only marketplace SOPs can be added to cart' },
        { status: 400 }
      );
    }

    if (sop.creatorId === user.id) {
      return NextResponse.json(
        { error: 'Cannot add your own SOP to cart' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        sopId,
        buyerId: user.id,
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this SOP' },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Add item to cart (or do nothing if already exists due to unique constraint)
    try {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          sopId,
        },
      });
    } catch (error: any) {
      // If unique constraint violation, item already in cart
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Item already in cart' },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sopId = searchParams.get('sopId');

    if (!sopId) {
      return NextResponse.json({ error: 'SOP ID is required' }, { status: 400 });
    }

    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Remove item
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        sopId,
      },
    });

    return NextResponse.json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
