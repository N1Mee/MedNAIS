
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { Navigation } from "@/components/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Settings,
  Users,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface GroupSettingsPageProps {
  params: {
    id: string;
  };
}

async function getGroupForSettings(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      admin: true,
      memberships: {
        include: {
          user: true
        }
      },
      sops: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (!group || group.adminId !== userId) {
    return null; // Only admin can access settings
  }

  return group;
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth');
  }

  const group = await getGroupForSettings(params.id, user.id);

  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <PageHeader 
        title="Group Settings"
        description={`Manage settings for ${group.name}`}
      >
        <Button variant="outline" asChild>
          <Link href={`/groups/${group.id}`}>
            Back to Group
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Group Name</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                {group.name}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                {group.description}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Invite Code</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono">
                  {group.inviteCode}
                </div>
                <CopyButton text={group.inviteCode} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Share this code with people you want to invite to the group
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Group Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {group.memberships.filter(m => m.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-blue-800">Active Members</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {group.sops.length}
                </div>
                <div className="text-sm text-green-800">Group SOPs</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {group.memberships.filter(m => m.status === 'PENDING').length}
                </div>
                <div className="text-sm text-orange-800">Pending Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-red-900">Delete Group</h3>
              <p className="text-sm text-red-700 mb-3">
                Once you delete a group, there is no going back. This will:
              </p>
              <ul className="text-sm text-red-700 space-y-1 mb-4 pl-4">
                <li>• Remove all group members</li>
                <li>• Convert all group SOPs to personal SOPs</li>
                <li>• Delete all group-related execution analytics</li>
                <li>• This action cannot be undone</li>
              </ul>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={true} // Disable for now since we haven't implemented the delete functionality
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Contact support to delete this group
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Need to edit group details?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Contact support if you need to change the group name, description, 
                  or transfer ownership to another admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
