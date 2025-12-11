
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SOPCard } from "@/components/sop-card";
import { TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getRecentSOPs() {
  return await prisma.sOP.findMany({
    where: { visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: 6,
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
  });
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
    take: 8,
    include: {
      _count: {
        select: { sops: true },
      },
    },
  });
}

export default async function HomePage() {
  const [recentSOPs, categories] = await Promise.all([
    getRecentSOPs(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[hsl(215,28%,17%)] to-[hsl(215,28%,25%)] text-white py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Turn Your Expertise Into Income. Create and Sell{" "}
              <span className="text-[#E63946]">SOPs</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Structured knowledge becomes a digital product. Build step-by-step
              Standard Operating Procedures and sell them worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold"
              >
                Browse Marketplace
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sops/new"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[hsl(215,28%,17%)] rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                Create Your SOP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/10 mb-4">
                <TrendingUp className="h-8 w-8 text-[#E63946]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clarity</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everything is broken down into simple, actionable steps.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/10 mb-4">
                <Shield className="h-8 w-8 text-[#E63946]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scalability</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your knowledge becomes a reusable digital asset.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/10 mb-4">
                <Zap className="h-8 w-8 text-[#E63946]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Monetization</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set your price and earn from every purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Find SOPs tailored to your industry
                </p>
              </div>
              <Link
                href="/categories"
                className="text-[#E63946] hover:underline font-medium"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md hover:shadow-xl transition group"
                >
                  <div className="text-3xl mb-3">{category.icon || "📁"}</div>
                  <h3 className="font-semibold mb-1 group-hover:text-[#E63946] transition">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category._count?.sops || 0} SOPs
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent SOPs */}
      {recentSOPs.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Discover SOPs Created by Experts
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Latest procedures added to the marketplace
                </p>
              </div>
              <Link
                href="/marketplace"
                className="text-[#E63946] hover:underline font-medium"
              >
                View All
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSOPs.map((sop) => (
                <SOPCard key={sop.id} sop={sop} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#E63946] to-[#E63946]/80 text-white">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Turn Your Knowledge Into a Business
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Start creating SOPs today and join the next generation of digital
            creators.
          </p>
          <Link
            href="/sops/new"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#E63946] rounded-lg hover:bg-gray-100 transition font-semibold"
          >
            Create Your SOP
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
