
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SOPDetailClient } from "./sop-detail-client";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function getSOP(id: string) {
  const sop = await prisma.sOP.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      },
      category: true,
      steps: {
        orderBy: { order: "asc" },
      },
    },
  });

  return sop;
}

async function getRelatedSOPs(categoryId: string | null, currentId: string) {
  if (!categoryId) return [];

  return await prisma.sOP.findMany({
    where: {
      categoryId,
      visibility: "public",
      NOT: { id: currentId },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      category: true,
      _count: {
        select: { steps: true },
      },
    },
  });
}

async function checkPurchaseStatus(userId: string | null, sopId: string): Promise<boolean> {
  if (!userId) return false;
  
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      sopId,
      status: "completed",
    },
  });
  
  return !!purchase;
}

export default async function SOPDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  
  const [sop, relatedSOPs] = await Promise.all([
    getSOP(params.id),
    getSOP(params.id).then((s) =>
      s ? getRelatedSOPs(s.categoryId, params.id) : []
    ),
  ]);

  if (!sop) {
    notFound();
  }

  // SERVER-SIDE SECURITY: Check if user has access to full content
  const isAuthor = user?.id === sop.author.id;
  const isPaid = sop.price > 0;
  const hasPurchased = user?.id ? await checkPurchaseStatus(user.id, sop.id) : false;
  const hasFullAccess = isAuthor || !isPaid || hasPurchased;

  // CRITICAL SECURITY: Filter out step content for non-purchasers
  // Only send first 2 steps with content, rest are placeholder
  let filteredSteps = sop.steps;
  if (!hasFullAccess && isPaid) {
    filteredSteps = sop.steps.map((step, index) => {
      if (index < 2) {
        // First 2 steps: show full content
        return step;
      } else {
        // Remaining steps: return placeholder (NO CONTENT IN DOM)
        return {
          id: step.id,
          createdAt: step.createdAt,
          updatedAt: step.updatedAt,
          title: "🔒 Locked Step",
          description: "Purchase this SOP to unlock",
          order: step.order,
          duration: null,
          images: [],
          imageUrl: null,
          videoUrl: null,
          countdownSeconds: null,
          question: null,
          questionType: null,
          sopId: step.sopId,
          isLocked: true, // Flag for client to show lock icon
        };
      }
    });
  }

  const sopWithFilteredSteps = {
    ...sop,
    steps: filteredSteps,
  };

  return <SOPDetailClient sop={sopWithFilteredSteps} relatedSOPs={relatedSOPs} hasFullAccess={hasFullAccess} />;
}
