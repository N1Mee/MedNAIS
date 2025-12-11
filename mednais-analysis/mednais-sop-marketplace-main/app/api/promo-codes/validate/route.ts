import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { code, totalAmount } = await req.json();

    if (!code || !totalAmount) {
      return NextResponse.json(
        { error: 'Code and total amount are required' },
        { status: 400 }
      );
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      );
    }

    // Check if active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { error: 'This promo code is no longer active' },
        { status: 400 }
      );
    }

    // Check expiration
    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      );
    }

    // Check start date
    if (promoCode.startsAt && new Date(promoCode.startsAt) > new Date()) {
      return NextResponse.json(
        { error: 'This promo code is not yet active' },
        { status: 400 }
      );
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return NextResponse.json(
        { error: 'This promo code has reached its maximum number of uses' },
        { status: 400 }
      );
    }

    // Check minimum purchase
    if (promoCode.minPurchase && totalAmount < promoCode.minPurchase) {
      return NextResponse.json(
        { 
          error: `Minimum purchase of $${(promoCode.minPurchase / 100).toFixed(2)} required for this code` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = (totalAmount * promoCode.discountValue) / 100;
      
      // Apply max discount cap if set
      if (promoCode.maxDiscount && discountAmount > promoCode.maxDiscount) {
        discountAmount = promoCode.maxDiscount;
      }
    } else if (promoCode.discountType === 'FIXED') {
      discountAmount = promoCode.discountValue;
      
      // Don't exceed total amount
      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }
    }

    const finalAmount = totalAmount - discountAmount;

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.round(finalAmount),
      message: promoCode.discountType === 'PERCENTAGE'
        ? `${promoCode.discountValue}% off applied`
        : `$${(promoCode.discountValue / 100).toFixed(2)} off applied`
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
