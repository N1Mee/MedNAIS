
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navigation } from "@/components/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserPlus, Users, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function JoinGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to join groups");
      return;
    }

    if (!inviteCode.trim()) {
      toast.error("Invite code is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join group');
      }

      const result = await response.json();
      
      if (result.status === 'PENDING') {
        toast.success("Request sent! Wait for admin approval.");
        router.push('/groups');
      } else if (result.status === 'APPROVED') {
        toast.success("Successfully joined the group!");
        router.push(`/groups/${result.groupId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to join group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <PageHeader 
        title="Join Group"
        description="Join an existing group using an invite code"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Join Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character invite code"
                    required
                    disabled={isSubmitting}
                    className="pl-10 font-mono"
                    maxLength={8}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Get the invite code from your group administrator
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enter the 8-character invite code provided by the group admin</li>
                  <li>• Your join request will be sent to the group administrator</li>
                  <li>• Once approved, you'll get access to group SOPs</li>
                  <li>• You can execute group SOPs and your performance will be tracked</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Join Group
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
