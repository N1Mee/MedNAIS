import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If no Connect account, return not connected
    if (!user.stripeConnectId) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    return NextResponse.json({
      connected: true,
      accountId: user.stripeConnectId,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
    });
  } catch (error: any) {
    console.error("Connect status error:", error);
    
    // If account doesn't exist in Stripe but we have an ID, clear it
    if (error.code === 'resource_missing') {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        await prisma.user.update({
          where: { email: session.user.email },
          data: { stripeConnectId: null },
        });
      }
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to get account status" },
      { status: 500 }
    );
  }
}
