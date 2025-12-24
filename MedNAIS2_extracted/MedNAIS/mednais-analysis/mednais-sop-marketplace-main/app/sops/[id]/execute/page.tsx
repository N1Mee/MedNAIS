
'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer } from "@/components/ui/timer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play, 
  Pause,
  RotateCcw,
  Home,
  Clock,
  Youtube,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { formatTime } from "@/lib/timer";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  imageId?: string;
  youtubeUrl?: string;
  timerSeconds?: number;
  question?: string;
}

interface SOP {
  id: string;
  title: string;
  description: string;
  steps: SOPStep[];
}

interface StepExecution {
  stepId: string;
  timeSeconds: number;
  startTime?: number;
  answer?: boolean;
}

export default function ExecuteSOPPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingSessionId = searchParams?.get('sessionId');
  
  const [sop, setSOp] = useState<SOP | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [stepExecutions, setStepExecutions] = useState<Map<string, StepExecution>>(new Map());
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalExecutionTime, setTotalExecutionTime] = useState(0);
  const [isResumingSession, setIsResumingSession] = useState(false);

  // Load SOP data
  useEffect(() => {
    const loadSOP = async () => {
      try {
        const response = await fetch(`/api/sops/${params.id}`);
        if (!response.ok) {
          if (response.status === 403) {
            toast.error("You don't have access to this SOP");
            router.push('/marketplace');
            return;
          }
          throw new Error('Failed to load SOP');
        }

        const data = await response.json();
        setSOp(data);
      } catch (error) {
        console.error('Error loading SOP:', error);
        toast.error('Failed to load SOP');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadSOP();
    }
  }, [params.id, router]);

  // Start execution when SOP is loaded or resume existing session
  useEffect(() => {
    if (sop && !executionId) {
      if (existingSessionId) {
        loadExistingSession();
      } else {
        startExecution();
      }
    }
  }, [sop, existingSessionId]);

  // Start step timer when step changes
  useEffect(() => {
    if (sop && !isCompleted) {
      setStepStartTime(Date.now());
    }
  }, [currentStepIndex, sop, isCompleted]);

  const startExecution = async () => {
    try {
      const response = await fetch('/api/sop-executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopId: params.id })
      });

      if (!response.ok) throw new Error('Failed to start execution');

      const execution = await response.json();
      setExecutionId(execution.id);
    } catch (error) {
      console.error('Error starting execution:', error);
      toast.error('Failed to start execution');
    }
  };

  const loadExistingSession = async () => {
    if (!existingSessionId || !sop) return;

    setIsResumingSession(true);
    try {
      const response = await fetch(`/api/sessions/${existingSessionId}`);
      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const sessionData = await response.json();

      // Verify this session belongs to the current SOP
      if (sessionData.sop.id !== params.id) {
        toast.error('This session does not belong to this SOP');
        router.push(`/sops/${params.id}/execute`);
        return;
      }

      // Only resume if status is IN_PROGRESS
      if (sessionData.status !== 'IN_PROGRESS') {
        toast.error('This session is already completed');
        router.push(`/sops/${params.id}/execute`);
        return;
      }

      // Set the execution ID
      setExecutionId(sessionData.id);

      // Load completed step executions
      const completedSteps = new Map<string, StepExecution>();
      sessionData.stepExecutions.forEach((stepExec: any) => {
        completedSteps.set(stepExec.step.id, {
          stepId: stepExec.step.id,
          timeSeconds: stepExec.timeSeconds,
          answer: stepExec.answer
        });
      });
      setStepExecutions(completedSteps);

      // Find the next step to continue from (first step not completed)
      const lastCompletedStepOrder = sessionData.stepExecutions.length > 0
        ? Math.max(...sessionData.stepExecutions.map((se: any) => se.step.order))
        : 0;

      // Start from the next step after the last completed one
      const nextStepIndex = sop.steps.findIndex(step => step.order > lastCompletedStepOrder);
      const resumeIndex = nextStepIndex !== -1 ? nextStepIndex : 0;

      setCurrentStepIndex(resumeIndex);
      toast.success(`Resuming from step ${resumeIndex + 1}`);
    } catch (error) {
      console.error('Error loading existing session:', error);
      toast.error('Failed to load session, starting new one');
      startExecution();
    } finally {
      setIsResumingSession(false);
    }
  };

  const recordStepTime = useCallback((stepId: string, timeSeconds: number) => {
    setStepExecutions(prev => {
      const updated = new Map(prev);
      updated.set(stepId, { stepId, timeSeconds });
      return updated;
    });
  }, []);

  const goToNextStep = async () => {
    if (!sop || !stepStartTime) return;

    const currentStep = sop.steps[currentStepIndex];
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    
    // Record time for current step
    recordStepTime(currentStep.id, timeSpent);

    if (currentStepIndex < sop.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      await completeExecution();
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setStepStartTime(Date.now()); // Reset timer for previous step
    }
  };

  const completeExecution = async () => {
    if (!executionId || !sop) return;

    try {
      const totalTime = Array.from(stepExecutions.values()).reduce(
        (total, execution) => total + execution.timeSeconds, 
        0
      );

      // Add current step time if not completed yet
      const currentStep = sop.steps[currentStepIndex];
      const currentStepTime = stepStartTime ? Math.floor((Date.now() - stepStartTime) / 1000) : 0;
      
      const allStepExecutions = Array.from(stepExecutions.values());
      if (!stepExecutions.has(currentStep.id)) {
        allStepExecutions.push({ stepId: currentStep.id, timeSeconds: currentStepTime });
      }

      const finalTotalTime = allStepExecutions.reduce(
        (total, execution) => total + execution.timeSeconds, 
        0
      );

      const response = await fetch(`/api/sop-executions/${executionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepExecutions: allStepExecutions,
          totalTimeSeconds: finalTotalTime
        })
      });

      if (!response.ok) throw new Error('Failed to complete execution');

      setIsCompleted(true);
      setTotalExecutionTime(finalTotalTime);
      toast.success('SOP completed successfully!');
    } catch (error) {
      console.error('Error completing execution:', error);
      toast.error('Failed to complete execution');
    }
  };

  const restartExecution = () => {
    setCurrentStepIndex(0);
    setStepExecutions(new Map());
    setIsCompleted(false);
    setStepStartTime(Date.now());
    startExecution();
  };

  if (isLoading || isResumingSession) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold">
              {isResumingSession ? 'Loading session...' : 'Loading SOP...'}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!sop || !user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold mb-4">SOP not found or access denied</h2>
          <Button asChild>
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = sop.steps[currentStepIndex];
  const progress = ((currentStepIndex + (isCompleted ? 1 : 0)) / sop.steps.length) * 100;

  if (isCompleted) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="text-green-600 mb-4">
                <Check className="h-16 w-16 mx-auto" />
              </div>
              <CardTitle className="text-2xl text-green-800">SOP Completed!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <p className="text-green-700 text-lg mb-2">
                  Congratulations! You've successfully completed:
                </p>
                <p className="text-xl font-semibold text-foreground">{sop.title}</p>
              </div>

              <div className="bg-background rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Total Time</p>
                    <p className="text-2xl font-bold text-green-600">{formatTime(totalExecutionTime)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Steps Completed</p>
                    <p className="text-2xl font-bold text-green-600">{sop.steps.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {executionId && (
                  <Button asChild>
                    <Link href={`/sessions/${executionId}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Session Details
                    </Link>
                  </Button>
                )}
                <Button onClick={restartExecution} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Execute Again
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/sops/${sop.id}`}>
                    View SOP Details
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sop.title}</h1>
              <p className="text-muted-foreground">Step {currentStepIndex + 1} of {sop.steps.length}</p>
            </div>
            <Badge variant="outline" className={existingSessionId ? "text-green-600" : "text-blue-600"}>
              {existingSessionId ? 'Resuming' : 'In Progress'}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                <span className="text-blue-600 font-bold mr-2">#{currentStep.order}</span>
                {currentStep.title}
              </CardTitle>
              
              {currentStep.timerSeconds && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <Timer
                    initialSeconds={currentStep.timerSeconds}
                    autoStart={false}
                    onComplete={() => toast.success('Timer completed!')}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step Description */}
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Media Content */}
            {currentStep.imageId && (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={`/api/assets/${ encodeURIComponent(currentStep.imageId) }`}
                  alt={`Step ${currentStep.order} illustration`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {currentStep.youtubeUrl && (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(currentStep.youtubeUrl) || undefined}
                  title={`Step ${currentStep.order} video`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}

            {/* Question */}
            {currentStep.question && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">
                  {currentStep.question}
                </h3>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className={`flex-1 ${stepExecutions.get(currentStep.id)?.answer === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    variant={stepExecutions.get(currentStep.id)?.answer === true ? 'default' : 'outline'}
                    onClick={() => {
                      const currentExecution = stepExecutions.get(currentStep.id) || { stepId: currentStep.id, timeSeconds: 0 };
                      currentExecution.answer = true;
                      setStepExecutions(new Map(stepExecutions.set(currentStep.id, currentExecution)));
                      toast.success('Answer "Yes" saved');
                    }}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Yes
                  </Button>
                  <Button
                    size="lg"
                    className={`flex-1 ${stepExecutions.get(currentStep.id)?.answer === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    variant={stepExecutions.get(currentStep.id)?.answer === false ? 'default' : 'outline'}
                    onClick={() => {
                      const currentExecution = stepExecutions.get(currentStep.id) || { stepId: currentStep.id, timeSeconds: 0 };
                      currentExecution.answer = false;
                      setStepExecutions(new Map(stepExecutions.set(currentStep.id, currentExecution)));
                      toast.success('Answer "No" saved');
                    }}
                  >
                    <ChevronRight className="h-5 w-5 mr-2 rotate-90" />
                    No
                  </Button>
                </div>
              </div>
            )}

            {/* Step Time Tracker */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Step Time</span>
                </div>
                <div className="text-2xl font-mono font-bold text-blue-600">
                  {stepStartTime ? formatTime(Math.floor((Date.now() - stepStartTime) / 1000)) : '00:00'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Step
          </Button>

          <div className="text-sm text-gray-500">
            {currentStepIndex + 1} / {sop.steps.length}
          </div>

          <Button onClick={goToNextStep}>
            {currentStepIndex === sop.steps.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete SOP
              </>
            ) : (
              <>
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" size="sm" asChild>
            <a href={`/sops/${sop.id}`}>
              View SOP Details
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

