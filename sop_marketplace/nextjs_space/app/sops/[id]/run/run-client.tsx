
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Timer, 
  Play, 
  Pause,
  Youtube,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Step {
  id: string;
  order: number;
  title: string;
  description: string | null;
  imageUrl?: string | null;
  images?: string[];
  videoUrl?: string | null;
  duration?: number | null;
  countdownSeconds?: number | null;
  question?: string | null;
  questionType?: string | null;
}

interface SOP {
  id: string;
  title: string;
  description: string | null;
  steps: Step[];
}

interface SOPSession {
  id: string;
  sopId: string;
  status: string;
  totalDuration: number;
  sop: SOP;
}

// Helper component to display images with signed URLs
function StepImageDisplay({ imageKey, alt }: { imageKey: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageKey) {
      fetch(`/api/download?key=${encodeURIComponent(imageKey)}`)
        .then((res) => res.json())
        .then((data) => setImageUrl(data.url))
        .catch(() => setImageUrl(imageKey)); // Fallback to original URL
    }
  }, [imageKey]);

  if (!imageUrl) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  );
}

export default function RunSOPClient({ sopId }: { sopId: string }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession() || {};
  
  const [loading, setLoading] = useState(true);
  const [sop, setSop] = useState<SOP | null>(null);
  const [sopSession, setSopSession] = useState<SOPSession | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [stepTimers, setStepTimers] = useState<{ [key: string]: number }>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownActive, setCountdownActive] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
    } else if (sessionStatus === "authenticated") {
      initializeSession();
    }
  }, [sessionStatus, sopId]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      
      // Fetch SOP details
      const sopRes = await fetch(`/api/sops/${sopId}`);
      if (!sopRes.ok) {
        throw new Error("Failed to fetch SOP");
      }
      const sopData = await sopRes.json();
      setSop(sopData);

      // Start a new session
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sopId }),
      });

      if (!sessionRes.ok) {
        const error = await sessionRes.json();
        throw new Error(error.error || "Failed to start session");
      }

      const sessionData = await sessionRes.json();
      setSopSession(sessionData);
      setStepStartTime(Date.now());
    } catch (error: any) {
      console.error("Error initializing session:", error);
      toast.error(error.message || "Failed to start SOP session");
      router.push(`/sops/${sopId}`);
    } finally {
      setLoading(false);
    }
  };

  const saveStepProgress = async (stepId: string, timeSpent: number, answer?: string) => {
    if (!sopSession) return;

    try {
      await fetch(`/api/sessions/${sopSession.id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          timeSpent,
          answer: answer || null,
          completed: true,
        }),
      });
    } catch (error) {
      console.error("Error saving step progress:", error);
    }
  };

  const handleNextStep = async () => {
    if (!sop || !sopSession) return;

    const currentStep = sop.steps[currentStepIndex];
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);

    // Save current step progress
    await saveStepProgress(currentStep.id, timeSpent, answer || undefined);

    // Update step timer
    setStepTimers((prev) => ({
      ...prev,
      [currentStep.id]: (prev[currentStep.id] || 0) + timeSpent,
    }));

    if (currentStepIndex < sop.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setStepStartTime(Date.now());
      setAnswer(null);
      setCountdown(null);
      setCountdownActive(false);
    } else {
      // Complete session
      await completeSession();
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setStepStartTime(Date.now());
      setAnswer(null);
      setCountdown(null);
      setCountdownActive(false);
    }
  };

  const completeSession = async () => {
    if (!sopSession) return;

    try {
      await fetch(`/api/sessions/${sopSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      toast.success("SOP completed successfully! 🎉");
      
      // Redirect to session details page to view statistics
      setTimeout(() => {
        router.push(`/sessions/${sopSession.id}`);
      }, 1000);
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
    }
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    setCountdownActive(true);
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdownActive && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdownActive(false);
    }
  }, [countdown, countdownActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const extractYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?]+)/);
    return match ? match[1] : null;
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E63946] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SOP...</p>
        </div>
      </div>
    );
  }

  if (!sop || !sopSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load SOP</p>
        </div>
      </div>
    );
  }

  const currentStep = sop.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / sop.steps.length) * 100;
  const isLastStep = currentStepIndex === sop.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{sop.title}</h1>
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {sop.steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#E63946] h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#E63946] text-white flex items-center justify-center font-bold text-lg">
              {currentStepIndex + 1}
            </div>
            <h2 className="text-2xl font-bold">{currentStep.title}</h2>
          </div>

          {currentStep.description && (
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentStep.description}
              </p>
            </div>
          )}

          {/* Multiple Images */}
          {currentStep.images && currentStep.images.length > 0 && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStep.images
                  .filter((img: string) => img && img.trim())
                  .map((img: string, idx: number) => (
                    <StepImageDisplay key={idx} imageKey={img} alt={`Step image ${idx + 1}`} />
                  ))}
              </div>
            </div>
          )}

          {/* YouTube Video */}
          {currentStep.videoUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Youtube className="h-5 w-5 text-red-600" />
                Video Tutorial
              </h3>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {extractYouTubeVideoId(currentStep.videoUrl) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeVideoId(currentStep.videoUrl)}`}
                    title="YouTube video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Invalid video URL</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {currentStep.countdownSeconds && currentStep.countdownSeconds > 0 && (
            <div className="mb-6 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Timer className="h-5 w-5 text-orange-600" />
                Countdown Timer
              </h3>
              {!countdownActive ? (
                <button
                  onClick={() => startCountdown(currentStep.countdownSeconds || 0)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  <Play className="h-4 w-4" />
                  Start {formatTime(currentStep.countdownSeconds || 0)}
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-orange-600">
                    {formatTime(countdown || 0)}
                  </div>
                  {countdown === 0 && (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Yes/No Question */}
          {currentStep.questionType === "yes_no" && currentStep.question && (
            <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-3">{currentStep.question}</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setAnswer("yes")}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    answer === "yes"
                      ? "bg-green-600 text-white"
                      : "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-green-600"
                  }`}
                >
                  <Check className="h-5 w-5 inline mr-2" />
                  Yes
                </button>
                <button
                  onClick={() => setAnswer("no")}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    answer === "no"
                      ? "bg-red-600 text-white"
                      : "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-red-600"
                  }`}
                >
                  <X className="h-5 w-5 inline mr-2" />
                  No
                </button>
              </div>
            </div>
          )}

          {/* Estimated Duration */}
          {currentStep.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4" />
              Estimated time: {currentStep.duration} minutes
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}