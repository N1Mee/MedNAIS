
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Crown, 
  Clock, 
  FileText,
  Settings,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface GroupsTabsProps {
  owned: any[];
  member: any[];
}

export function GroupsTabs({ owned, member }: GroupsTabsProps) {
  return (
    <Tabs defaultValue="owned" className="space-y-6">
      <TabsList>
        <TabsTrigger value="owned" className="flex items-center space-x-2">
          <Crown className="h-4 w-4" />
          <span>My Groups ({owned.length})</span>
        </TabsTrigger>
        <TabsTrigger value="member" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Member of ({member.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="owned">
        {owned.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {owned.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-600" />
                        {group.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                    <Badge variant="secondary">Admin</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group._count.memberships} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{group._count.sops} SOPs</span>
                      </div>
                    </div>

                    {/* Created date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/groups/${group.id}`}>
                          View Group
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/groups/${group.id}/settings`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Crown className="h-16 w-16" />}
            title="No groups created yet"
            description="Create your first group to start collaborating with team members"
            action={
              <Button asChild>
                <Link href="/groups/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Link>
              </Button>
            }
          />
        )}
      </TabsContent>

      <TabsContent value="member">
        {member.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {member.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                    <Badge variant="outline">Member</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Admin info */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Admin: </span>
                      <span className="font-medium">{group.admin?.name || group.admin?.email}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group._count.memberships} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{group._count.sops} SOPs</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/groups/${group.id}`}>
                        View Group
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-16 w-16" />}
            title="Not a member of any groups"
            description="Join groups to access shared SOPs and collaborate with teams"
            action={
              <Button variant="outline" asChild>
                <Link href="/groups/join">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join a Group
                </Link>
              </Button>
            }
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
