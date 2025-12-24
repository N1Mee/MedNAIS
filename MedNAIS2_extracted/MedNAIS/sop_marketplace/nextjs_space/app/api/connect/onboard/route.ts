import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    if (user.role !== "seller") {
      return NextResponse.json(
        { error: "Only sellers can connect payout accounts" },
        { status: 403 }
      );
    }

    let accountId = user.stripeConnectId;

    // If user doesn't have a Connect account, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
      });

      accountId = account.id;

      // Save the account ID to the user
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectId: accountId },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/balance?refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/balance?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error("Connect onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create onboarding link" },
      { status: 500 }
    );
  }
}
