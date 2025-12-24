export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const revenues = await prisma.revenue.findMany({
      where: { sellerId: userId },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
          }
        },
        purchase: {
          select: {
            id: true,
            createdAt: true,
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
        createdAt: 'desc'
      }
    });

    const totalEarnings = revenues.reduce((sum, rev) => sum + (rev?.amount ?? 0), 0);
    const platformFees = revenues.reduce((sum, rev) => sum + (rev?.platformFee ?? 0), 0);
    
    const pendingBalance = revenues
      .filter(rev => rev?.status === 'pending')
      .reduce((sum, rev) => sum + (rev?.amount ?? 0), 0);
    
    const availableBalance = revenues
      .filter(rev => rev?.status === 'available')
      .reduce((sum, rev) => sum + (rev?.amount ?? 0), 0);
    
    const paidOut = revenues
      .filter(rev => rev?.status === 'paid')
      .reduce((sum, rev) => sum + (rev?.amount ?? 0), 0);

    const earningsBySop = revenues.reduce((acc, rev) => {
      const sopId = rev?.sopId;
      if (!sopId) return acc;
      if (!acc[sopId]) {
        acc[sopId] = {
          sopId,
          sopTitle: rev?.sop?.title || 'Unknown SOP',
          earnings: 0,
          salesCount: 0,
        };
      }
      acc[sopId].earnings += (rev?.amount ?? 0);
      acc[sopId].salesCount += 1;
      return acc;
    }, {} as Record<string, any>);

    const recentTransactions = revenues.slice(0, 10).map(rev => ({
      id: rev?.id,
      amount: rev?.amount ?? 0,
      platformFee: rev?.platformFee ?? 0,
      status: rev?.status || 'unknown',
      sopTitle: rev?.sop?.title || 'Unknown',
      buyerName: rev?.purchase?.user?.name || 'Unknown',
      createdAt: rev?.createdAt,
    }));

    return NextResponse.json({
      totalEarnings,
      platformFees,
      netEarnings: totalEarnings,
      pendingBalance,
      availableBalance,
      paidOut,
      earningsBySop: Object.values(earningsBySop),
      recentTransactions,
    });
    
  } catch (error: any) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
