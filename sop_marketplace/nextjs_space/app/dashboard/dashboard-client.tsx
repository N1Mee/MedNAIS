
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Play,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardClientProps {
  user: any;
  sops: any[];
  purchases: any[];
  sessions: any[];
}

type Tab = "overview" | "sops" | "purchases" | "sessions";

export function DashboardClient({
  user,
  sops,
  purchases,
  sessions,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const handleDeleteSOP = async (sopId: string) => {
    if (!confirm("Are you sure you want to delete this SOP?")) return;

    try {
      const response = await fetch(`/api/sops/${sopId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete SOP");
      }

      toast.success("SOP deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting SOP:", error);
      toast.error("Failed to delete SOP");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Session deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      abandoned: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-8 w-8 text-[#E63946]" />
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name || "User"}!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              My SOPs
            </h3>
            <FileText className="h-5 w-5 text-[#E63946]" />
          </div>
          <p className="text-3xl font-bold">{sops.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Purchases
            </h3>
            <ShoppingBag className="h-5 w-5 text-[#E63946]" />
          </div>
          <p className="text-3xl font-bold">{purchases.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sessions
            </h3>
            <Play className="h-5 w-5 text-[#E63946]" />
          </div>
          <p className="text-3xl font-bold">{sessions.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed
            </h3>
            <CheckCircle className="h-5 w-5 text-[#E63946]" />
          </div>
          <p className="text-3xl font-bold">
            {sessions.filter((s) => s.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "overview"
                  ? "border-b-2 border-[#E63946] text-[#E63946]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("sops")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "sops"
                  ? "border-b-2 border-[#E63946] text-[#E63946]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              My SOPs ({sops.length})
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "purchases"
                  ? "border-b-2 border-[#E63946] text-[#E63946]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Purchases ({purchases.length})
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "sessions"
                  ? "border-b-2 border-[#E63946] text-[#E63946]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Sessions ({sessions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.role === "seller" && (
                    <Link
                      href="/sops/new"
                      className="flex items-center gap-3 p-4 bg-[#E63946]/10 hover:bg-[#E63946]/20 rounded-lg transition"
                    >
                      <Plus className="h-6 w-6 text-[#E63946]" />
                      <div>
                        <p className="font-semibold">Create New SOP</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Share your expertise
                        </p>
                      </div>
                    </Link>
                  )}
                  <Link
                    href="/marketplace"
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition"
                  >
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold">Browse Marketplace</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Find new SOPs
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{session.sop.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <Link
                          href={`/sessions/${session.id}`}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* My SOPs Tab */}
          {activeTab === "sops" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">My SOPs</h2>
                {user?.role === "seller" && (
                  <Link
                    href="/sops/new"
                    className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Create SOP
                  </Link>
                )}
              </div>

              {sops.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No SOPs yet</p>
                  {user?.role === "seller" && (
                    <Link
                      href="/sops/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First SOP
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {sops.map((sop) => (
                    <div
                      key={sop.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold">{sop.title}</h3>
                          {sop.category && (
                            <span className="px-2 py-1 bg-[#E63946]/10 text-[#E63946] text-xs rounded-full whitespace-nowrap text-center">
                              {sop.category.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="whitespace-nowrap">{sop._count.steps} steps</span>
                          <span className="whitespace-nowrap">{sop._count.purchases} purchases</span>
                          <span className="whitespace-nowrap">{sop._count.ratings} ratings</span>
                          <span className="font-semibold text-[#E63946] whitespace-nowrap">
                            ${sop.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Link
                          href={`/sops/${sop.id}`}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/sops/${sop.id}/edit`}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteSOP(sop.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === "purchases" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">My Purchases</h2>

              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No purchases yet</p>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((purchase) => {
                    // Handle cases where SOP or author might be deleted
                    const sopTitle = purchase.sop?.title || "Deleted SOP";
                    const authorName = purchase.sop?.author?.name || "Unknown Author";
                    const sopId = purchase.sop?.id;

                    return (
                      <div
                        key={purchase.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {sopTitle}
                            </h3>
                            {getStatusBadge(purchase.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="whitespace-nowrap">by {authorName}</span>
                            <span className="whitespace-nowrap">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </span>
                            <span className="font-semibold text-[#E63946] whitespace-nowrap">
                              ${purchase.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="self-start sm:self-center">
                          {sopId ? (
                            <Link
                              href={`/sops/${sopId}`}
                              className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition whitespace-nowrap"
                            >
                              View SOP
                            </Link>
                          ) : (
                            <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed whitespace-nowrap">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">My Execution Sessions</h2>

              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No sessions yet</p>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
                  >
                    Find SOPs to Execute
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">{session.sop.title}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.totalDuration)}
                          </span>
                          <span className="whitespace-nowrap">
                            Started:{" "}
                            {new Date(session.startedAt).toLocaleDateString()}
                          </span>
                          {session.completedAt && (
                            <span className="whitespace-nowrap">
                              Completed:{" "}
                              {new Date(
                                session.completedAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition whitespace-nowrap"
                        >
                          View Details
                        </Link>
                        {session.status === "in_progress" && (
                          <Link
                            href={`/sops/${session.sop.id}/run`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                          >
                            Continue
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
