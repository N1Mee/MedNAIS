
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  User,
  FileText,
  Timer,
  HelpCircle,
} from "lucide-react";

interface SessionDetailClientProps {
  session: any;
}

export function SessionDetailClient({ session }: SessionDetailClientProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "in_progress":
        return <AlertCircle className="h-6 w-6 text-blue-600" />;
      case "abandoned":
        return <XCircle className="h-6 w-6 text-gray-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      in_progress:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      abandoned:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          styles[status as keyof typeof styles] || styles.abandoned
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const completedSteps = session.sessionSteps.filter(
    (ss: any) => ss.completedAt
  ).length;
  const totalSteps = session.sop.steps.length;
  const completionPercentage = Math.round(
    (completedSteps / totalSteps) * 100
  );

  // Calculate average time per step
  const totalTimeSpent = session.sessionSteps.reduce(
    (sum: number, ss: any) => sum + (ss.timeSpent || 0),
    0
  );
  const avgTimePerStep =
    completedSteps > 0 ? Math.round(totalTimeSpent / completedSteps) : 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-[#E63946] hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          {getStatusIcon(session.status)}
          <h1 className="text-3xl font-bold">{session.sop.title}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Session Details & Statistics
        </p>
      </div>

      {/* Session Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            {getStatusBadge(session.status)}
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Total Duration</span>
            </div>
            <p className="text-2xl font-bold">
              {formatDuration(session.totalDuration)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <p className="text-2xl font-bold">
              {completedSteps}/{totalSteps}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-[#E63946] h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">Avg Time/Step</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(avgTimePerStep)}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <p className="font-medium">
                {new Date(session.startedAt).toLocaleString()}
              </p>
            </div>
            {session.completedAt && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Completed:
                </span>
                <p className="font-medium">
                  {new Date(session.completedAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-600 dark:text-gray-400">Author:</span>
              <p className="font-medium">{session.sop.author.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#E63946]" />
          Steps Performance
        </h2>

        <div className="space-y-3">
          {session.sop.steps.map((step: any, index: number) => {
            const sessionStep = session.sessionSteps.find(
              (ss: any) => ss.stepId === step.id
            );
            const isExpanded = expandedSteps.has(step.id);
            const isCompleted = sessionStep?.completedAt;

            return (
              <div
                key={step.id}
                className={`border rounded-lg overflow-hidden transition ${
                  isCompleted
                    ? "border-green-500 dark:border-green-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{step.title}</h3>
                      {sessionStep && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Time spent: {formatDuration(sessionStep.timeSpent)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sessionStep?.timeSpent && (
                      <span className="px-3 py-1 bg-[#E63946]/10 text-[#E63946] rounded-full text-sm font-medium">
                        {formatDuration(sessionStep.timeSpent)}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {step.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Description:
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {step.description}
                        </p>
                      </div>
                    )}

                    {sessionStep && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Started:
                          </p>
                          <p className="font-medium">
                            {sessionStep.startedAt
                              ? new Date(sessionStep.startedAt).toLocaleString()
                              : "Not started"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Completed:
                          </p>
                          <p className="font-medium">
                            {sessionStep.completedAt
                              ? new Date(
                                  sessionStep.completedAt
                                ).toLocaleString()
                              : "Not completed"}
                          </p>
                        </div>
                      </div>
                    )}

                    {step.countdownSeconds && (
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Suggested duration:
                        </span>
                        <span className="font-medium">
                          {formatDuration(step.countdownSeconds)}
                        </span>
                      </div>
                    )}

                    {step.question && sessionStep?.answer && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                          <p className="font-medium text-sm">{step.question}</p>
                        </div>
                        <p className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Answer:
                          </span>{" "}
                          <span
                            className={`font-semibold ${
                              sessionStep.answer === "yes"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {sessionStep.answer?.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-4">
        <Link
          href={`/sops/${session.sop.id}`}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          View SOP Details
        </Link>
        {session.status === "in_progress" && (
          <Link
            href={`/sops/${session.sop.id}/run`}
            className="flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
          >
            <Play className="h-5 w-5" />
            Continue Session
          </Link>
        )}
      </div>
    </div>
  );
}
