export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("🔍 Checking pending purchases for user:", userId);

    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        userId,
        status: "pending",
        stripeSessionId: { not: null }
      },
      include: {
        sop: {
          include: {
            author: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📋 Found ${pendingPurchases.length} pending purchases`);

    let completed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const purchase of pendingPurchases) {
      try {
        console.log(`  Checking purchase ${purchase.id} with session ${purchase.stripeSessionId}`);
        
        const stripeSession = await stripe.checkout.sessions.retrieve(purchase.stripeSessionId!);
        
        console.log(`    Payment status: ${stripeSession.payment_status}`);

        if (stripeSession.payment_status === 'paid') {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              status: "completed",
              stripePaymentId: stripeSession.payment_intent as string || undefined,
            },
          });

          if (purchase.promoCodeId) {
            await prisma.promoCode.update({
              where: { id: purchase.promoCodeId },
              data: { usedCount: { increment: 1 } },
            });
          }

          const existingRevenue = await prisma.revenue.findUnique({
            where: { purchaseId: purchase.id }
          });

          if (!existingRevenue) {
            await prisma.revenue.create({
              data: {
                sellerId: purchase.sop.authorId,
                sopId: purchase.sopId,
                purchaseId: purchase.id,
                amount: purchase.sellerRevenue,
                platformFee: purchase.platformFee,
                status: "pending",
              },
            });
          }

          console.log(`    ✅ Purchase completed`);
          completed++;
        } else {
          console.log(`    ⏳ Still pending payment`);
        }
      } catch (error: any) {
        console.error(`    ❌ Error processing purchase ${purchase.id}:`, error.message);
        errors.push(`Purchase ${purchase.id}: ${error.message}`);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: pendingPurchases.length,
      completed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      message: completed > 0 
        ? `Completed ${completed} purchase(s)` 
        : "No purchases needed completion"
    });

  } catch (error: any) {
    console.error("❌ Check pending purchases error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check purchases" },
      { status: 500 }
    );
  }
}
