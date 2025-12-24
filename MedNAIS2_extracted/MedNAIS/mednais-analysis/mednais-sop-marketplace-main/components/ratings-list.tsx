"use client";

import { useEffect, useState } from 'react';
import { RatingStars } from './rating-stars';
import { Avatar, AvatarFallback } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Rating {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url?: string | null;
  };
}

interface RatingsListProps {
  sopId: string;
}

export function RatingsList({ sopId }: RatingsListProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [sopId]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/ratings?sopId=${sopId}`);
      const data = await response.json();

      if (response.ok) {
        setRatings(data.ratings || []);
        setAverage(data.average || 0);
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading ratings...</div>;
  }

  if (count === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No ratings yet. Be the first to rate this SOP!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Average Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {average.toFixed(1)}
        </div>
        <RatingStars rating={average} size="lg" showValue={false} className="justify-center mb-2" />
        <p className="text-sm text-gray-600">
          Based on {count} {count === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Individual Ratings */}
      <div className="space-y-4">
        {ratings.map((rating) => {
          const userName = rating.user?.name || rating.user?.email || 'Anonymous';
          const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

          return (
            <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#E63946] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <RatingStars rating={rating.rating} size="sm" showValue={false} className="mb-2" />
                  {rating.comment && (
                    <p className="text-gray-700 text-sm">{rating.comment}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
