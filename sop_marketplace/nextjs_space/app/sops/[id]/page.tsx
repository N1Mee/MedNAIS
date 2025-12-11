
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SOPDetailClient } from "./sop-detail-client";

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

export default async function SOPDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [sop, relatedSOPs] = await Promise.all([
    getSOP(params.id),
    getSOP(params.id).then((s) =>
      s ? getRelatedSOPs(s.categoryId, params.id) : []
    ),
  ]);

  if (!sop) {
    notFound();
  }

  return <SOPDetailClient sop={sop} relatedSOPs={relatedSOPs} />;
}
