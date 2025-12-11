
import { prisma } from "@/lib/db";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getCategoryWithSOPs(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      sops: {
        where: { visibility: "public" },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          _count: {
            select: { steps: true },
          },
        },
      },
    },
  });

  return category;
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategoryWithSOPs(params.slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{category.icon || "📁"}</div>
          <div>
            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {category.sops.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SOPs in This Category"
          description="Be the first to create an SOP in this category."
          action={{
            label: "Create SOP",
            href: "/sops/new",
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.sops.map((sop) => (
            <SOPCard key={sop.id} sop={sop} />
          ))}
        </div>
      )}
    </div>
  );
}
