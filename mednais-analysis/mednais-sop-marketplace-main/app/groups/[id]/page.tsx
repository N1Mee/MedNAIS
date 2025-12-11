
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { Navigation } from "@/components/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GroupDetailTabs } from "./group-detail-tabs";
import { 
  Users, 
  Settings,
  Plus
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface GroupPageProps {
  params: {
    id: string;
  };
}

async function getGroupDetails(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      admin: true,
      memberships: {
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      },
      sops: {
        include: {
          creator: true,
          steps: true,
          _count: { select: { executions: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!group) return null;

  // Check if user has access to this group
  const userMembership = group.memberships.find(m => m.userId === userId);
  const isAdmin = group.adminId === userId;
  const isMember = userMembership?.status === 'APPROVED';

  if (!isAdmin && !isMember) {
    return null; // No access
  }

  return {
    group,
    isAdmin,
    isMember,
    userMembership
  };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  const result = await getGroupDetails(params.id, user.id);

  if (!result) {
    notFound();
  }

  const { group, isAdmin, isMember } = result;
  const approvedMembers = group.memberships.filter(m => m.status === 'APPROVED');
  const pendingMembers = group.memberships.filter(m => m.status === 'PENDING');

  const inviteUrl = `${process.env.NEXTAUTH_URL}/groups/join?code=${group.inviteCode}`;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <PageHeader 
        title={group.name}
        description={group.description}
      >
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/groups/${group.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/sops/create?groupId=${group.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create SOP
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {approvedMembers.length}
              </div>
              <p className="text-sm text-muted-foreground">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SOPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {group.sops.length}
              </div>
              <p className="text-sm text-muted-foreground">Group procedures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
              </div>
              <p className="text-sm text-muted-foreground">by {group.admin?.name || group.admin?.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Invite Link */}
        {isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  Invite Code: <strong>{group.inviteCode}</strong>
                </div>
                <CopyButton text={group.inviteCode} />
              </div>
            </CardContent>
          </Card>
        )}

        <GroupDetailTabs 
          group={group}
          approvedMembers={approvedMembers}
          pendingMembers={pendingMembers}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
