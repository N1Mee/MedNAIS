import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/promo-codes/validate - Validate a promo code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, message: "Invalid promo code format" },
        { status: 400 }
      );
    }

    // Find promo code in database
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json({
        valid: false,
        message: "Promo code not found",
      });
    }

    // Check if promo code is active
    if (!promoCode.active) {
      return NextResponse.json({
        valid: false,
        message: "This promo code is no longer active",
      });
    }

    // Check usage limit
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({
        valid: false,
        message: "This promo code has reached its usage limit",
      });
    }

    // Check expiry date
    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: "This promo code has expired",
      });
    }

    // Determine discount type and value
    const discountType = promoCode.discountAmount ? "fixed" : "percentage";
    const discountValue = promoCode.discountAmount || promoCode.discountPercent;

    // Valid promo code
    return NextResponse.json({
      valid: true,
      message: "Promo code applied successfully",
      promoCode: {
        code: promoCode.code,
        discountType,
        discountValue,
      },
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred while validating the promo code" },
      { status: 500 }
    );
  }
}
