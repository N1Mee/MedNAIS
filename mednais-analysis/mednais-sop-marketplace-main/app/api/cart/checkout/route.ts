import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin_url } = await req.json();

    if (!origin_url) {
      return NextResponse.json(
        { error: 'Origin URL is required' },
        { status: 400 }
      );
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            sop: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Prepare cart items data
    const cartItems = cart.items.map(item => ({
      sop_id: item.sop.id,
      sop_title: item.sop.title,
      sop_price: item.sop.price || 0,
      creator_id: item.sop.creatorId,
    }));

    // Forward request to FastAPI backend
    const backendUrl = `http://localhost:8001/api/stripe/create-cart-checkout`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.id}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        origin_url,
        cart_items: cartItems,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Clear cart after successful checkout session creation
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Cart checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
