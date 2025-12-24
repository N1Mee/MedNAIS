
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { sops: true },
      },
    },
  });
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Categories</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore SOPs organized by industry and use case
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No categories available yet.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition p-6 group"
            >
              <div className="text-4xl mb-4">{category.icon || "📁"}</div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-[#E63946] transition">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {category.description}
                </p>
              )}
              <p className="text-sm font-medium text-[#E63946]">
                {category._count?.sops || 0} SOPs
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
