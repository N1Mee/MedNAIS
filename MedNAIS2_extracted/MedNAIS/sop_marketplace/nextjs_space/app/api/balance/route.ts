// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * Balance and Revenue API
 * 
 * Returns seller's earnings, balance, and transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all revenue records for this seller
    const revenues = await prisma.revenue.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            price: true,
          }
        },
        purchase: {
          select: {
            id: true,
            createdAt: true,
            amount: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalEarnings = revenues.reduce((sum, rev) => sum + rev.amount, 0);
    const pendingBalance = revenues
      .filter(rev => rev.status === 'pending')
      .reduce((sum, rev) => sum + rev.amount, 0);
    const paidOut = revenues
      .filter(rev => rev.status === 'paid')
      .reduce((sum, rev) => sum + rev.amount, 0);
    const processing = revenues
      .filter(rev => rev.status === 'processing')
      .reduce((sum, rev) => sum + rev.amount, 0);

    // Get sales count by SOP
    const sopSales = await prisma.purchase.groupBy({
      by: ['sopId'],
      where: {
        sop: {
          authorId: session.user.id,
        },
        status: 'completed',
      },
      _count: {
        id: true,
      },
    });

    // Get SOP details for sales count
    const sopIds = sopSales.map(s => s.sopId);
    const sops = await prisma.sOP.findMany({
      where: {
        id: { in: sopIds },
      },
      select: {
        id: true,
        title: true,
        price: true,
      },
    });

    const salesBySOP = sopSales.map(sale => {
      const sop = sops.find(s => s.id === sale.sopId);
      return {
        sopId: sale.sopId,
        sopTitle: sop?.title || 'Unknown SOP',
        sopPrice: sop?.price || 0,
        salesCount: sale._count.id,
        revenue: (sop?.price || 0) * sale._count.id * 0.7, // 70% seller revenue
      };
    });

    return NextResponse.json({
      summary: {
        totalEarnings,
        pendingBalance,
        paidOut,
        processing,
        totalSales: revenues.length,
      },
      revenues: revenues.map(rev => ({
        id: rev.id,
        amount: rev.amount,
        platformFee: rev.platformFee,
        status: rev.status,
        payoutDate: rev.payoutDate,
        createdAt: rev.createdAt,
        sop: rev.sop,
        buyer: rev.purchase.user,
        purchaseDate: rev.purchase.createdAt,
      })),
      salesBySOP,
    });
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
