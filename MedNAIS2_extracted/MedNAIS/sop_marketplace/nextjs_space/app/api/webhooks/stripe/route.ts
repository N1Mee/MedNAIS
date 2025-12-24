// Force dynamic rendering for webhook endpoint
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  console.log("🔔 Webhook received");
  
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  console.log("📝 Webhook body length:", body.length);
  console.log("🔑 Signature present:", !!signature);

  if (!signature) {
    console.error("❌ No signature provided");
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    console.log("🔐 Verifying webhook signature...");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("✅ Signature verified successfully");
    console.log("📋 Event type:", event.type);
    console.log("🆔 Event ID:", event.id);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("💳 Processing checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("📦 Session metadata:", JSON.stringify(session.metadata, null, 2));
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.payment_failed": {
        console.log("❌ Processing payment_intent.payment_failed");
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook handler error:", error);
    console.error("Stack trace:", error.stack);
    // Still return 200 to Stripe to prevent retries
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("🔄 Starting handleCheckoutCompleted");
  
  const purchaseIdsStr = session.metadata?.purchaseIds;
  const sopIdsStr = session.metadata?.sopIds;
  const userId = session.metadata?.userId;

  console.log("📊 Metadata received:");
  console.log("  - purchaseIds:", purchaseIdsStr);
  console.log("  - sopIds:", sopIdsStr);
  console.log("  - userId:", userId);

  if (!purchaseIdsStr || !sopIdsStr || !userId) {
    console.error("❌ Missing required metadata in checkout session");
    console.error("Available metadata:", JSON.stringify(session.metadata, null, 2));
    return;
  }

  // Parse comma-separated IDs
  const purchaseIds = purchaseIdsStr.split(",").map(id => id.trim()).filter(id => id);
  const sopIds = sopIdsStr.split(",").map(id => id.trim()).filter(id => id);

  console.log(`📋 Processing ${purchaseIds.length} purchase(s)`);

  // Update all purchases to completed
  for (let i = 0; i < purchaseIds.length; i++) {
    const purchaseId = purchaseIds[i];
    const sopId = sopIds[i];

    try {
      console.log(`  ➡️  Processing purchase ${i + 1}/${purchaseIds.length}: ${purchaseId}`);

      // Update purchase status
      const purchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: "completed",
          stripePaymentId: session.payment_intent as string,
        },
        include: {
          sop: {
            include: {
              author: true,
            }
          }
        }
      });

      console.log(`    ✅ Purchase updated to completed`);
      console.log(`    💰 Amount: $${purchase.amount}`);
      console.log(`    👤 Seller: ${purchase.sop.author.name} (${purchase.sop.authorId})`);

      // Increment promo code usage if used (only once for the first purchase)
      if (i === 0 && purchase.promoCodeId) {
        await prisma.promoCode.update({
          where: { id: purchase.promoCodeId },
          data: {
            usedCount: { increment: 1 },
          },
        });
        console.log(`    🎟️  Promo code usage incremented`);
      }

      // Create revenue record for seller
      await prisma.revenue.create({
        data: {
          sellerId: purchase.sop.authorId,
          sopId: sopId,
          purchaseId: purchase.id,
          amount: purchase.sellerRevenue,
          platformFee: purchase.platformFee,
          status: "pending",
        },
      });

      console.log(`    💵 Revenue record created for seller`);
      console.log(`       Seller revenue: $${purchase.sellerRevenue}`);
      console.log(`       Platform fee: $${purchase.platformFee}`);

    } catch (error: any) {
      console.error(`    ❌ Error processing purchase ${purchaseId}:`, error.message);
      console.error(error.stack);
      // Continue with other purchases even if one fails
    }
  }

  console.log("✅ All purchases processed successfully");
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("🔄 Starting handlePaymentFailed");
  
  const metadata = paymentIntent.metadata;
  const purchaseIdsStr = metadata?.purchaseIds;

  console.log("📊 Payment Intent metadata:", JSON.stringify(metadata, null, 2));

  if (purchaseIdsStr) {
    const purchaseIds = purchaseIdsStr.split(",").map(id => id.trim()).filter(id => id);
    
    console.log(`❌ Marking ${purchaseIds.length} purchase(s) as failed`);

    for (const purchaseId of purchaseIds) {
      try {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { status: "failed" },
        });
        console.log(`  ❌ Purchase ${purchaseId} marked as failed`);
      } catch (error: any) {
        console.error(`  ⚠️  Error updating purchase ${purchaseId}:`, error.message);
      }
    }
  } else {
    console.warn("⚠️  No purchaseIds found in payment intent metadata");
  }
}
