
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Clock,
  CheckCircle,
  PlayCircle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatTime } from "@/lib/timer";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

interface ExecutionSession {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalTimeSeconds?: number;
  sop: {
    id: string;
    title: string;
    description: string;
  };
  stepExecutions: Array<{
    id: string;
    timeSeconds: number;
    answer?: boolean;
  }>;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ExecutionSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'completed') return s.status === 'COMPLETED';
    if (filter === 'in_progress') return s.status === 'IN_PROGRESS';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ABANDONED':
        return 'bg-gray-100 text-foreground';
      default:
        return 'bg-gray-100 text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Group sessions by SOP to show comparison
  const sessionsBySOP = filteredSessions.reduce((acc, session) => {
    if (!acc[session.sop.id]) {
      acc[session.sop.id] = [];
    }
    acc[session.sop.id].push(session);
    return acc;
  }, {} as Record<string, ExecutionSession[]>);

  const getTimeComparison = (sopSessions: ExecutionSession[]) => {
    const completedSessions = sopSessions
      .filter(s => s.status === 'COMPLETED' && s.totalTimeSeconds)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (completedSessions.length < 2) return null;

    const latest = completedSessions[0].totalTimeSeconds!;
    const previous = completedSessions[1].totalTimeSeconds!;
    const diff = latest - previous;
    const percentChange = ((diff / previous) * 100).toFixed(1);

    return {
      diff,
      percentChange,
      improved: diff < 0
    };
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <PageHeader 
        title="Execution Sessions"
        description="History of your SOP executions with detailed statistics"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({sessions.length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Completed ({sessions.filter(s => s.status === 'COMPLETED').length})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in_progress')}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            In Progress ({sessions.filter(s => s.status === 'IN_PROGRESS').length})
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No Sessions"
            description="You have not executed any SOPs yet. Start an execution to see statistics here."
            action={
              <Button asChild>
                <Link href="/sops">Go to SOPs</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(sessionsBySOP).map(([sopId, sopSessions]) => {
              const sop = sopSessions[0].sop;
              const comparison = getTimeComparison(sopSessions);

              return (
                <Card key={sopId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="mb-2">{sop.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{sopSessions.length} executions</p>
                      </div>
                      {comparison && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          comparison.improved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {comparison.improved ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          {Math.abs(Number(comparison.percentChange))}% {comparison.improved ? 'faster' : 'slower'}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sopSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-background border rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Badge className={getStatusColor(session.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(session.status)}
                                {session.status === 'COMPLETED' ? 'Completed' : 
                                 session.status === 'IN_PROGRESS' ? 'In Progress' : 'Abandoned'}
                              </span>
                            </Badge>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                            </div>

                            {session.totalTimeSeconds && (
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Clock className="h-4 w-4" />
                                {formatTime(session.totalTimeSeconds)}
                              </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                              {session.stepExecutions.length} steps completed
                            </div>
                          </div>

                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/sessions/${session.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
