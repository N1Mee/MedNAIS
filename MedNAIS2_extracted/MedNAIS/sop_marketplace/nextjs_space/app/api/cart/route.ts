
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/cart - Get user's cart
export async function GET() {
  try {
    const user = await requireAuth();

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        sop: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { sopId } = body;

    if (!sopId) {
      return NextResponse.json({ error: "sopId is required" }, { status: 400 });
    }

    // Check if SOP exists
    const sop = await prisma.sOP.findUnique({
      where: { id: sopId },
      include: {
        author: true,
      },
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Check if SOP is free
    if (sop.price === 0) {
      return NextResponse.json(
        { error: "Free SOPs cannot be added to cart" },
        { status: 400 }
      );
    }

    // Check if user already owns this SOP
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        sopId,
        status: "completed",
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already own this SOP" },
        { status: 400 }
      );
    }

    // Check if user is the author
    if (sop.authorId === user.id) {
      return NextResponse.json(
        { error: "You cannot add your own SOP to cart" },
        { status: 400 }
      );
    }

    // Add to cart (or update if already exists)
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_sopId: {
          userId: user.id,
          sopId,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        sopId,
      },
      include: {
        sop: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE() {
  try {
    const user = await requireAuth();

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
