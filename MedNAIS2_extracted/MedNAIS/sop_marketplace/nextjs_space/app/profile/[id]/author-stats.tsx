
"use client";

import { useState, useEffect } from "react";
import { Star, FileText, ShoppingCart, MessageSquare } from "lucide-react";
import { StarRating } from "@/components/star-rating";

interface AuthorStatsProps {
  userId: string;
}

interface Stats {
  totalSOPs: number;
  averageRating: number;
  totalRatings: number;
  totalPurchases: number;
  totalComments: number;
}

export function AuthorStats({ userId }: AuthorStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching author stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {/* Total SOPs */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">SOPs</span>
        </div>
        <p className="text-2xl font-bold">{stats.totalSOPs}</p>
      </div>

      {/* Average Rating */}
      {stats.totalRatings > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            <StarRating rating={stats.averageRating} readonly size="sm" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.totalRatings} rating{stats.totalRatings !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Total Purchases */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">Purchases</span>
        </div>
        <p className="text-2xl font-bold">{stats.totalPurchases}</p>
      </div>

      {/* Total Comments */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Comments</span>
        </div>
        <p className="text-2xl font-bold">{stats.totalComments}</p>
      </div>
    </div>
  );
}
