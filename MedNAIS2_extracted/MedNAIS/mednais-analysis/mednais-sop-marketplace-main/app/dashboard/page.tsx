
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { ServerHeader } from "@/components/layout/server-header";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SOPCard } from "@/components/sop-card";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  FileText, 
  ShoppingBag, 
  Users, 
  Play, 
  Plus
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  const [userSOPs, purchasedSOPs, userGroups, recentExecutions, stats] = await Promise.all([
    // User's created SOPs
    prisma.sOP.findMany({
      where: { creatorId: userId },
      include: {
        creator: true,
        steps: true,
        _count: { select: { executions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),

    // Purchased SOPs
    prisma.purchase.findMany({
      where: { buyerId: userId },
      include: {
        sop: {
          include: {
            creator: true,
            steps: true,
            _count: { select: { executions: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),

    // User's groups
    prisma.groupMembership.findMany({
      where: { 
        userId,
        status: 'APPROVED'
      },
      include: {
        group: {
          include: {
            _count: { select: { memberships: true, sops: true } }
          }
        }
      },
      take: 3
    }),

    // Recent executions
    prisma.sOPExecution.findMany({
      where: { userId },
      include: {
        sop: {
          select: {
            title: true,
            type: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 5
    }),

    // Statistics
    Promise.all([
      prisma.sOP.count({ where: { creatorId: userId } }),
      prisma.purchase.count({ where: { buyerId: userId } }),
      prisma.groupMembership.count({ 
        where: { userId, status: 'APPROVED' } 
      }),
      prisma.sOPExecution.count({ where: { userId } })
    ])
  ]);

  const [createdCount, purchasedCount, groupCount, executionCount] = stats;

  return {
    userSOPs,
    purchasedSOPs: purchasedSOPs.map(p => p.sop),
    userGroups,
    recentExecutions,
    stats: {
      created: createdCount,
      purchased: purchasedCount,
      groups: groupCount,
      executions: executionCount
    }
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth');
  }

  const data = await getDashboardData(user.id);

  const formatExecutionTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ServerHeader />
      <main className="flex-1">
        <PageHeader 
        title={`Welcome back, ${user.name || user.email}!`}
        description="Here's what's happening with your SOPs"
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/sops/create">
              <Plus className="h-4 w-4 mr-2" />
              Create SOP
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#E63946] to-[#D62839] text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Created SOPs</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.created}</div>
              <p className="text-xs text-white/70 mt-1">Your total SOPs</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Purchased</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{data.stats.purchased}</div>
              <p className="text-xs text-gray-500 mt-1">SOPs you own</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Groups</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{data.stats.groups}</div>
              <p className="text-xs text-gray-500 mt-1">Teams & groups</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Executions</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{data.stats.executions}</div>
              <p className="text-xs text-gray-500 mt-1">Total runs</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My SOPs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#E63946] to-[#D62839] bg-clip-text text-transparent">My SOPs</h2>
              <Button variant="outline" size="sm" asChild className="border-[#E63946] text-[#E63946] hover:bg-[#E63946] hover:text-white">
                <Link href="/sops">View All</Link>
              </Button>
            </div>
            
            {data.userSOPs.length > 0 ? (
              <div className="space-y-4">
                {data.userSOPs.map((sop) => (
                  <SOPCard 
                    key={sop.id} 
                    sop={sop} 
                    showCreator={false}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="No SOPs yet"
                    description="Create your first SOP to get started"
                    action={
                      <Button asChild>
                        <Link href="/sops/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Create SOP
                        </Link>
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-6">
                {data.recentExecutions.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentExecutions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 bg-blue-100 rounded">
                            <Play className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{execution.sop.title}</p>
                            <p className="text-xs text-gray-500">
                              {execution.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {execution.totalTimeSeconds ? formatExecutionTime(execution.totalTimeSeconds) : 'In progress'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Play className="h-12 w-12" />}
                    title="No executions yet"
                    description="Execute a SOP to see your activity here"
                    action={
                      <Button variant="outline" asChild>
                        <Link href="/marketplace">
                          Browse Marketplace
                        </Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#E63946] to-[#D62839] bg-clip-text text-transparent mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/sops/create" className="group">
              <Card className="h-24 flex items-center justify-center bg-gradient-to-br from-[#E63946] to-[#D62839] text-white border-0 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center space-y-2 p-4">
                  <Plus className="h-6 w-6" />
                  <span className="font-semibold">Create SOP</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/marketplace" className="group">
              <Card className="h-24 flex items-center justify-center border-2 border-gray-200 hover:border-[#E63946] hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center space-y-2 p-4">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-700">Browse Marketplace</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/groups/create" className="group">
              <Card className="h-24 flex items-center justify-center border-2 border-gray-200 hover:border-[#E63946] hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center space-y-2 p-4">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="font-semibold text-gray-700">Create Group</span>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/sops" className="group">
              <Card className="h-24 flex items-center justify-center border-2 border-gray-200 hover:border-[#E63946] hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="flex flex-col items-center space-y-2 p-4">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-gray-700">My SOPs</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
