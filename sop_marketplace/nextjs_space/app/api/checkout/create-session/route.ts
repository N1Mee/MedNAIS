
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe, calculateRevenueSplit } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sopId, sopIds, promoCode } = body;

    // Support both single SOP and cart checkout
    let sopsToCheckout: string[] = [];
    
    if (sopIds && Array.isArray(sopIds)) {
      // Cart checkout
      sopsToCheckout = sopIds;
    } else if (sopId) {
      // Single SOP checkout (backward compatibility)
      sopsToCheckout = [sopId];
    } else {
      return NextResponse.json(
        { error: "sopId or sopIds is required" },
        { status: 400 }
      );
    }

    if (sopsToCheckout.length === 0) {
      return NextResponse.json(
        { error: "No SOPs selected for checkout" },
        { status: 400 }
      );
    }

    // Fetch SOP details
    const sops = await prisma.sOP.findMany({
      where: { id: { in: sopsToCheckout } },
      include: {
        author: true,
      },
    });

    if (sops.length === 0) {
      return NextResponse.json({ error: "No SOPs found" }, { status: 404 });
    }

    // Filter out free SOPs
    const paidSops = sops.filter((sop) => sop.price > 0);

    if (paidSops.length === 0) {
      return NextResponse.json(
        { error: "All selected SOPs are free" },
        { status: 400 }
      );
    }

    // Check for already owned SOPs
    const existingPurchases = await prisma.purchase.findMany({
      where: {
        userId: session.user.id,
        sopId: { in: paidSops.map((s) => s.id) },
        status: "completed",
      },
    });

    const ownedSopIds = existingPurchases.map((p) => p.sopId);
    const sopsToCheckoutFiltered = paidSops.filter(
      (sop) => !ownedSopIds.includes(sop.id)
    );

    if (sopsToCheckoutFiltered.length === 0) {
      return NextResponse.json(
        { error: "You already own all selected SOPs" },
        { status: 400 }
      );
    }

    // Calculate total price
    const originalTotal = sopsToCheckoutFiltered.reduce(
      (sum, sop) => sum + sop.price,
      0
    );
    let finalTotal = originalTotal;
    let promoCodeRecord: any = null;

    // Apply promo code if provided
    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findUnique({
        where: { code: promoCode, active: true },
      });

      if (promoCodeRecord) {
        // Check expiry
        if (
          promoCodeRecord.expiresAt &&
          new Date(promoCodeRecord.expiresAt) < new Date()
        ) {
          return NextResponse.json(
            { error: "Promo code has expired" },
            { status: 400 }
          );
        }

        // Check max uses
        if (
          promoCodeRecord.maxUses &&
          promoCodeRecord.usedCount >= promoCodeRecord.maxUses
        ) {
          return NextResponse.json(
            { error: "Promo code has reached its usage limit" },
            { status: 400 }
          );
        }

        // Calculate discount on total
        if (promoCodeRecord.discountPercent > 0) {
          const discount = finalTotal * (promoCodeRecord.discountPercent / 100);
          finalTotal = finalTotal - discount;
        } else if (promoCodeRecord.discountAmount) {
          finalTotal = Math.max(0, finalTotal - promoCodeRecord.discountAmount);
        }
      }
    }

    // Create purchases for each SOP with proportional pricing if promo applied
    const purchases = await Promise.all(
      sopsToCheckoutFiltered.map(async (sop) => {
        // Calculate proportional price for this SOP
        const proportion = sop.price / originalTotal;
        const sopFinalPrice = finalTotal * proportion;

        const revenueSplit = calculateRevenueSplit(sopFinalPrice);

        return prisma.purchase.create({
          data: {
            userId: session.user.id,
            sopId: sop.id,
            amount: revenueSplit.totalAmount,
            platformFee: revenueSplit.platformFee,
            sellerRevenue: revenueSplit.sellerRevenue,
            promoCodeId: promoCodeRecord?.id,
            status: "pending",
          },
        });
      })
    );

    // Get origin for redirect URLs
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Determine success and cancel URLs
    const isCartCheckout = sopIds && Array.isArray(sopIds);
    const successUrl = isCartCheckout
      ? `${origin}/cart?payment=success`
      : `${origin}/sops/${sopId}?payment=success`;
    const cancelUrl = isCartCheckout
      ? `${origin}/cart?payment=cancelled`
      : `${origin}/sops/${sopId}?payment=cancelled`;

    // Create Stripe checkout session with all items
    const lineItems = sopsToCheckoutFiltered.map((sop) => {
      const proportion = sop.price / originalTotal;
      const sopFinalPrice = finalTotal * proportion;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: sop.title,
            description: sop.description || undefined,
          },
          unit_amount: Math.round(sopFinalPrice * 100), // Convert to cents
        },
        quantity: 1,
      };
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        purchaseIds: purchases.map((p) => p.id).join(","),
        sopIds: sopsToCheckoutFiltered.map((s) => s.id).join(","),
        userId: session.user.id,
      },
    });

    // Update all purchases with Stripe session ID
    await Promise.all(
      purchases.map((purchase) =>
        prisma.purchase.update({
          where: { id: purchase.id },
          data: { stripeSessionId: checkoutSession.id },
        })
      )
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
