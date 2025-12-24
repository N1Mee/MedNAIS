
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText,
  UserCheck,
  UserX,
  Plus
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface GroupDetailTabsProps {
  group: any;
  approvedMembers: any[];
  pendingMembers: any[];
  isAdmin: boolean;
}

export function GroupDetailTabs({ group, approvedMembers, pendingMembers, isAdmin }: GroupDetailTabsProps) {
  const handleApprove = async (membershipId: string) => {
    // TODO: Implement approve functionality
    console.log('Approve:', membershipId);
  };

  const handleReject = async (membershipId: string) => {
    // TODO: Implement reject functionality
    console.log('Reject:', membershipId);
  };

  return (
    <Tabs defaultValue="sops" className="space-y-6">
      <TabsList>
        <TabsTrigger value="sops">SOPs ({group.sops.length})</TabsTrigger>
        <TabsTrigger value="members">Members ({approvedMembers.length})</TabsTrigger>
        {isAdmin && pendingMembers.length > 0 && (
          <TabsTrigger value="pending">Pending ({pendingMembers.length})</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="sops">
        {group.sops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.sops.map((sop: any) => (
              <SOPCard 
                key={sop.id} 
                sop={sop}
                showCreator={true}
                showPrice={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-16 w-16" />}
            title="No SOPs yet"
            description="Create the first SOP for this group"
            action={
              <Button asChild>
                <Link href={`/sops/create?groupId=${group.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group SOP
                </Link>
              </Button>
            }
          />
        )}
      </TabsContent>

      <TabsContent value="members">
        <div className="space-y-4">
          {approvedMembers.map((membership: any) => (
            <Card key={membership.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {membership.user?.name || membership.user?.email}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Joined {formatDistanceToNow(new Date(membership.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {membership.userId === group.adminId && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                    <Badge variant="outline">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingMembers.map((membership: any) => (
              <Card key={membership.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {membership.user?.name || membership.user?.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Requested {formatDistanceToNow(new Date(membership.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleApprove(membership.id)}>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(membership.id)}>
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
