
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Navigation } from "@/components/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, Save } from "lucide-react";
import { toast } from "sonner";

export default function CreateGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to create groups");
      return;
    }

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create group');
      }

      const newGroup = await response.json();
      toast.success("Group created successfully!");
      router.push(`/groups/${newGroup.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <PageHeader 
        title="Create Group"
        description="Create a new group to collaborate with team members and share SOPs"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group name"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Choose a descriptive name for your group
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this group"
                  rows={4}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Explain what this group is for and what types of SOPs will be shared
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What happens after creation?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You'll become the group administrator</li>
                  <li>• A unique invite code will be generated</li>
                  <li>• You can invite members using the invite link</li>
                  <li>• You can create group-specific SOPs</li>
                  <li>• You can monitor group member performance</li>
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Group
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
