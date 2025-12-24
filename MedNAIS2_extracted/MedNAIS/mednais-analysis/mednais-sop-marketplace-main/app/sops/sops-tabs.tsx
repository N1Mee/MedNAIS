
'use client';

import { SOPCard } from "@/components/sop-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface SOPsTabsProps {
  created: any[];
  purchased: any[];
}

export function SOPsTabs({ created, purchased }: SOPsTabsProps) {
  return (
    <Tabs defaultValue="created" className="space-y-6">
      <TabsList>
        <TabsTrigger value="created" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Created ({created.length})</span>
        </TabsTrigger>
        <TabsTrigger value="purchased" className="flex items-center space-x-2">
          <ShoppingBag className="h-4 w-4" />
          <span>Purchased ({purchased.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="created">
        {created.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {created.map((sop) => (
              <SOPCard 
                key={sop.id} 
                sop={sop} 
                showCreator={false}
                showPrice={sop.type === 'MARKETPLACE'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-16 w-16" />}
            title="No SOPs created yet"
            description="Create your first SOP to share your expertise with others"
            action={
              <Button asChild>
                <Link href="/sops/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First SOP
                </Link>
              </Button>
            }
          />
        )}
      </TabsContent>

      <TabsContent value="purchased">
        {purchased.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchased.map((sop) => (
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
            icon={<ShoppingBag className="h-16 w-16" />}
            title="No SOPs purchased yet"
            description="Browse the marketplace to find SOPs created by experts"
            action={
              <Button asChild>
                <Link href="/marketplace">
                  Browse Marketplace
                </Link>
              </Button>
            }
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
