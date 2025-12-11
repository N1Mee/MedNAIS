
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/star-rating";
import Image from "next/image";

interface Rating {
  id: string;
  userId: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface RatingsSectionProps {
  sopId: string;
}

export function RatingsSection({ sopId }: RatingsSectionProps) {
  const { data: session } = useSession() || {};
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User's rating form
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [sopId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ratings?sopId=${sopId}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings);
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings);

        // Check if current user has already rated
        if (session?.user) {
          const userRatingData = data.ratings.find(
            (r: Rating) => r.userId === session.user.id
          );
          if (userRatingData) {
            setUserRating(userRatingData.rating);
            setUserReview(userRatingData.review || "");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!session?.user) {
      toast.error("Please sign in to rate this SOP");
      return;
    }

    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sopId,
          rating: userRating,
          review: userReview.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit rating");
      }

      toast.success("Rating submitted successfully!");
      setShowRatingForm(false);
      await fetchRatings();
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast.error(error.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" />
            Ratings & Reviews
          </h2>
          {totalRatings > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StarRating rating={averageRating} readonly size="md" />
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500 whitespace-nowrap">({totalRatings} ratings)</span>
            </div>
          )}
        </div>

        {session?.user && (
          <button
            onClick={() => setShowRatingForm(!showRatingForm)}
            className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition"
          >
            {showRatingForm ? "Cancel" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Rating Form */}
      {showRatingForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-[#E63946]/20">
          <h3 className="font-semibold mb-3">Your Rating</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating *</label>
              <StarRating
                rating={userRating}
                onRatingChange={setUserRating}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Review (optional)
              </label>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Share your thoughts about this SOP..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">
                {userReview.length}/500 characters
              </p>
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={submitting || userRating === 0}
              className="w-full py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      )}

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No ratings yet. Be the first to rate this SOP!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                  {rating.user.image ? (
                    <Image
                      src={rating.user.image}
                      alt={rating.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                      {rating.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-semibold">
                        {rating.user.name || "Anonymous"}
                      </p>
                      <StarRating rating={rating.rating} readonly size="sm" />
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                      {rating.review}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
