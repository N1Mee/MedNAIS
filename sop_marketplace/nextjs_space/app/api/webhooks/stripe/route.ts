
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
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
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const purchaseId = session.metadata?.purchaseId;
  const sopId = session.metadata?.sopId;
  const sellerId = session.metadata?.sellerId;

  if (!purchaseId || !sopId || !sellerId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Update purchase status
  const purchase = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: "completed",
      stripePaymentId: session.payment_intent as string,
    },
  });

  // Increment promo code usage if used
  if (purchase.promoCodeId) {
    await prisma.promoCode.update({
      where: { id: purchase.promoCodeId },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }

  // Create revenue record for seller
  await prisma.revenue.create({
    data: {
      sellerId: sellerId,
      sopId: sopId,
      purchaseId: purchase.id,
      amount: purchase.sellerRevenue,
      platformFee: purchase.platformFee,
      status: "pending",
    },
  });

  console.log(`Purchase ${purchaseId} completed successfully`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const purchaseId = metadata?.purchaseId;

  if (purchaseId) {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "failed" },
    });

    console.log(`Purchase ${purchaseId} failed`);
  }
}
