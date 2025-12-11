
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ServerHeader } from "@/components/layout/server-header";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SOPsTabs } from "./sops-tabs";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getUserSOPs(userId: string) {
  const [createdSOPs, purchasedSOPs] = await Promise.all([
    prisma.sOP.findMany({
      where: { creatorId: userId },
      include: {
        creator: true,
        steps: true,
        group: true,
        _count: { select: { executions: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    
    prisma.purchase.findMany({
      where: { buyerId: userId },
      include: {
        sop: {
          include: {
            creator: true,
            steps: true,
            group: true,
            _count: { select: { executions: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    created: createdSOPs,
    purchased: purchasedSOPs.map(p => p.sop)
  };
}

export default async function SOPsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  const sops = await getUserSOPs(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ServerHeader />
      <main className="flex-1">
        <PageHeader 
        title="My SOPs"
        description="Manage your created and purchased Standard Operating Procedures"
      >
        <Button asChild>
          <Link href="/sops/create">
            <Plus className="h-4 w-4 mr-2" />
            Create SOP
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SOPsTabs created={sops.created} purchased={sops.purchased} />
      </div>
      </main>
      <Footer />
    </div>
  );
}
