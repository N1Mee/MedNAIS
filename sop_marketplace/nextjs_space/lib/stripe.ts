
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = 30; // 30% platform fee
export const SELLER_REVENUE_PERCENT = 70; // 70% to seller

export function calculateRevenueSplit(amount: number) {
  const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
  const sellerRevenue = amount * (SELLER_REVENUE_PERCENT / 100);
  
  return {
    totalAmount: amount,
    platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimals
    sellerRevenue: Math.round(sellerRevenue * 100) / 100,
  };
}
