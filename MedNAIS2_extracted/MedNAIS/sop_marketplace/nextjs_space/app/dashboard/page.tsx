
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  const [user, sops, purchases, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    }),
    // User's SOPs (if seller)
    prisma.sOP.findMany({
      where: { authorId: userId },
      include: {
        category: true,
        _count: {
          select: {
            steps: true,
            purchases: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // User's purchases
    prisma.purchase.findMany({
      where: { userId },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            price: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // User's SOP sessions
    prisma.sOPSession.findMany({
      where: { userId },
      include: {
        sop: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            sessionSteps: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return { user, sops, purchases, sessions };
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin");
  }

  const data = await getDashboardData(currentUser.id);

  return <DashboardClient {...data} />;
}
