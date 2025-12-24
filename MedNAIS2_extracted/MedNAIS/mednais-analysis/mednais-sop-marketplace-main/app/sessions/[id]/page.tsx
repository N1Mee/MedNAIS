
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  CheckCircle, 
  Calendar,
  ArrowLeft,
  Timer as TimerIcon,
  Check,
  X,
  HelpCircle,
  Play,
  Trash2,
  Edit
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatTime } from "@/lib/timer";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StepExecution {
  id: string;
  timeSeconds: number;
  answer?: boolean | null;
  step: {
    id: string;
    order: number;
    title: string;
    description: string;
    question?: string | null;
  };
}

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
    creatorId: string;
  };
  stepExecutions: StepExecution[];
}

export default function SessionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  
  const [executionSession, setExecutionSession] = useState<ExecutionSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && sessionId) {
      loadSession();
    }
  }, [user, sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setExecutionSession(data);
      } else {
        router.push('/sessions');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      router.push('/sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Session deleted successfully');
        router.push('/sessions');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Error deleting session');
    }
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold">Loading session...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!executionSession) {
    return null;
  }

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

  const averageStepTime = executionSession.stepExecutions.length > 0
    ? Math.floor(
        executionSession.stepExecutions.reduce((sum, step) => sum + step.timeSeconds, 0) / 
        executionSession.stepExecutions.length
      )
    : 0;

  const longestStep = executionSession.stepExecutions.length > 0
    ? executionSession.stepExecutions.reduce((max, step) => 
        step.timeSeconds > max.timeSeconds ? step : max
      )
    : null;

  const shortestStep = executionSession.stepExecutions.length > 0
    ? executionSession.stepExecutions.reduce((min, step) => 
        step.timeSeconds < min.timeSeconds ? step : min
      )
    : null;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/sessions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>

          <div className="bg-background rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {executionSession.sop.title}
                </h1>
                <p className="text-muted-foreground">{executionSession.sop.description}</p>
              </div>
              <Badge className={getStatusColor(executionSession.status)}>
                {executionSession.status === 'COMPLETED' ? 'Completed' : 
                 executionSession.status === 'IN_PROGRESS' ? 'In Progress' : 'Abandoned'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Started</span>
                </div>
                <p className="text-sm text-foreground">
                  {formatDistanceToNow(new Date(executionSession.startedAt), { addSuffix: true })}
                </p>
              </div>

              {executionSession.completedAt && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Completed</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {formatDistanceToNow(new Date(executionSession.completedAt), { addSuffix: true })}
                  </p>
                </div>
              )}

              {executionSession.totalTimeSeconds !== null && executionSession.totalTimeSeconds !== undefined && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Total Time</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatTime(executionSession.totalTimeSeconds)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Step Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatTime(averageStepTime)}</p>
            </CardContent>
          </Card>

          {longestStep && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Longest Step</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatTime(longestStep.timeSeconds)}</p>
                <p className="text-sm text-muted-foreground mt-1">{longestStep.step.title}</p>
              </CardContent>
            </Card>
          )}

          {shortestStep && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Shortest Step</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatTime(shortestStep.timeSeconds)}</p>
                <p className="text-sm text-muted-foreground mt-1">{shortestStep.step.title}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Step Details */}
        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Execution Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executionSession.stepExecutions.map((stepExec, index) => (
                <div key={stepExec.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {stepExec.step.order}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{stepExec.step.title}</h3>
                        <div className="flex items-center gap-2">
                          <TimerIcon className="h-4 w-4 text-gray-400" />
                          <span className="font-mono font-medium text-foreground">
                            {formatTime(stepExec.timeSeconds)}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm mb-2">{stepExec.step.description}</p>

                      {stepExec.step.question && (
                        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <HelpCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-purple-900 mb-2">{stepExec.step.question}</p>
                              {stepExec.answer !== null && stepExec.answer !== undefined ? (
                                <Badge className={stepExec.answer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {stepExec.answer ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Yes
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      No
                                    </>
                                  )}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  No Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {index < executionSession.stepExecutions.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          {executionSession.status === 'IN_PROGRESS' ? (
            <>
              <Button asChild size="lg">
                <Link href={`/sops/${executionSession.sop.id}/execute?sessionId=${executionSession.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Continue Execution
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="lg">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible. All data from the unfinished session will be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              {/* Only show SOP Details and Edit buttons to the SOP owner */}
              {user?.id === executionSession.sop.creatorId && (
                <>
                  <Button asChild size="lg">
                    <Link href={`/sops/${executionSession.sop.id}`}>
                      View SOP Details
                    </Link>
                  </Button>

                  <Button variant="outline" size="lg" asChild>
                    <Link href={`/sops/${executionSession.sop.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit SOP
                    </Link>
                  </Button>
                </>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="lg">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible. All data from this completed session will be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
