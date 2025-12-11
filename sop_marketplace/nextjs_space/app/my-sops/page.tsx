
import { requireSeller } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/empty-state";
import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getMySOPs(userId: string) {
  return await prisma.sOP.findMany({
    where: { authorId: userId },
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
  });
}

export default async function MySOPsPage() {
  let user;
  try {
    user = await requireSeller();
  } catch (error) {
    redirect("/auth/signin?callbackUrl=/my-sops");
  }

  const sops = await getMySOPs(user.id);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My SOPs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your standard operating procedures
          </p>
        </div>

        <Link
          href="/sops/new"
          className="flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-semibold"
        >
          <PlusCircle className="h-5 w-5" />
          Create SOP
        </Link>
      </div>

      {sops.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SOPs Yet"
          description="Create your first SOP to start sharing your expertise with others."
          action={{
            label: "Create Your First SOP",
            href: "/sops/new",
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sops.map((sop) => (
            <SOPCard key={sop.id} sop={sop} />
          ))}
        </div>
      )}
    </div>
  );
}
