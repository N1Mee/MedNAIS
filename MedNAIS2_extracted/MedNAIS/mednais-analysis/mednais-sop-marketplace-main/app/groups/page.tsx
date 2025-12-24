
import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ServerHeader } from "@/components/layout/server-header";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { GroupsTabs } from "./groups-tabs";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getUserGroups(userId: string) {
  const [ownedGroups, memberGroups] = await Promise.all([
    // Groups where user is admin
    prisma.group.findMany({
      where: { adminId: userId },
      include: {
        _count: { 
          select: { 
            memberships: true, 
            sops: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    }),

    // Groups where user is a member
    prisma.groupMembership.findMany({
      where: { 
        userId,
        status: 'APPROVED',
        group: {
          adminId: { not: userId } // Exclude groups where user is admin
        }
      },
      include: {
        group: {
          include: {
            admin: true,
            _count: { 
              select: { 
                memberships: true, 
                sops: true 
              } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    owned: ownedGroups,
    member: memberGroups.map(m => m.group)
  };
}

export default async function GroupsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  const groups = await getUserGroups(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ServerHeader />
      <main className="flex-1">
        <PageHeader 
        title="My Groups"
        description="Manage your groups and collaborate with team members"
      >
        <Button asChild>
          <Link href="/groups/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupsTabs owned={groups.owned} member={groups.member} />
      </div>
      </main>
      <Footer />
    </div>
  );
}
