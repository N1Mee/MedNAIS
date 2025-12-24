// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

/**
 * Payment Verification and Completion Endpoint
 * 
 * This endpoint serves as a fallback mechanism when webhooks fail.
 * It verifies payment status directly with Stripe and completes pending purchases.
 * 
 * Flow:
 * 1. Client calls this after successful checkout redirect
 * 2. Verify session with Stripe API
 * 3. If payment_status = 'paid', complete pending purchases
 * 4. Create revenue records for sellers
 * 5. Return completion status
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Payment verification request received");
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("❌ Unauthorized verification attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      console.error("❌ No session ID provided");
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    console.log("📋 Verifying session:", sessionId);

    // Retrieve session from Stripe to verify payment status
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log("💳 Stripe session status:", stripeSession.payment_status);
    console.log("📦 Session metadata:", JSON.stringify(stripeSession.metadata, null, 2));

    // Check if payment was successful
    if (stripeSession.payment_status !== 'paid') {
      console.warn("⚠️  Payment not completed yet:", stripeSession.payment_status);
      return NextResponse.json({
        success: false,
        message: "Payment not completed",
        status: stripeSession.payment_status
      });
    }

    // Extract metadata
    const purchaseIdsStr = stripeSession.metadata?.purchaseIds;
    const sopIdsStr = stripeSession.metadata?.sopIds;
    const userId = stripeSession.metadata?.userId;

    if (!purchaseIdsStr || !sopIdsStr || !userId) {
      console.error("❌ Missing metadata in session");
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    // Verify user owns these purchases
    if (userId !== session.user.id) {
      console.error("❌ User ID mismatch:", { expected: userId, actual: session.user.id });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse IDs
    const purchaseIds = purchaseIdsStr.split(",").map(id => id.trim()).filter(id => id);
    const sopIds = sopIdsStr.split(",").map(id => id.trim()).filter(id => id);

    console.log(`🔄 Processing ${purchaseIds.length} purchase(s)`);

    let completedCount = 0;
    let alreadyCompletedCount = 0;
    const errors: string[] = [];

    // Process each purchase
    for (let i = 0; i < purchaseIds.length; i++) {
      const purchaseId = purchaseIds[i];
      const sopId = sopIds[i];

      try {
        console.log(`  ➡️  Processing purchase ${i + 1}/${purchaseIds.length}: ${purchaseId}`);

        // Check current purchase status
        const existingPurchase = await prisma.purchase.findUnique({
          where: { id: purchaseId },
          include: {
            sop: {
              include: {
                author: true,
              }
            }
          }
        });

        if (!existingPurchase) {
          console.error(`    ❌ Purchase not found: ${purchaseId}`);
          errors.push(`Purchase ${purchaseId} not found`);
          continue;
        }

        // If already completed, skip
        if (existingPurchase.status === "completed") {
          console.log(`    ✅ Purchase already completed: ${purchaseId}`);
          alreadyCompletedCount++;
          continue;
        }

        console.log(`    📝 Current status: ${existingPurchase.status}`);
        console.log(`    💰 Amount: $${existingPurchase.amount}`);
        console.log(`    👤 Seller: ${existingPurchase.sop.author.name} (${existingPurchase.sop.authorId})`);

        // Update purchase to completed
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: "completed",
            stripePaymentId: stripeSession.payment_intent as string,
          },
        });

        console.log(`    ✅ Purchase marked as completed`);

        // Increment promo code usage if used (only for first purchase)
        if (i === 0 && existingPurchase.promoCodeId) {
          await prisma.promoCode.update({
            where: { id: existingPurchase.promoCodeId },
            data: {
              usedCount: { increment: 1 },
            },
          });
          console.log(`    🎟️  Promo code usage incremented`);
        }

        // Check if revenue record already exists
        const existingRevenue = await prisma.revenue.findUnique({
          where: { purchaseId: purchaseId }
        });

        if (!existingRevenue) {
          // Create revenue record for seller
          await prisma.revenue.create({
            data: {
              sellerId: existingPurchase.sop.authorId,
              sopId: sopId,
              purchaseId: purchaseId,
              amount: existingPurchase.sellerRevenue,
              platformFee: existingPurchase.platformFee,
              status: "pending",
            },
          });

          console.log(`    💵 Revenue record created`);
          console.log(`       Seller revenue: $${existingPurchase.sellerRevenue}`);
          console.log(`       Platform fee: $${existingPurchase.platformFee}`);
        } else {
          console.log(`    ℹ️  Revenue record already exists`);
        }

        completedCount++;

      } catch (error: any) {
        console.error(`    ❌ Error processing purchase ${purchaseId}:`, error.message);
        console.error(error.stack);
        errors.push(`Failed to process purchase ${purchaseId}: ${error.message}`);
      }
    }

    console.log("✅ Verification complete");
    console.log(`   Completed: ${completedCount}`);
    console.log(`   Already completed: ${alreadyCompletedCount}`);
    console.log(`   Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      completed: completedCount,
      alreadyCompleted: alreadyCompletedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: completedCount > 0 
        ? `Successfully completed ${completedCount} purchase(s)` 
        : "All purchases were already completed"
    });

  } catch (error: any) {
    console.error("❌ Verification error:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
