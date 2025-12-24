"use client";

import { useEffect, useState } from 'react';
import { RatingStars } from './rating-stars';

interface SOPRatingBadgeProps {
  sopId: string;
  className?: string;
}

export function SOPRatingBadge({ sopId, className = '' }: SOPRatingBadgeProps) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const response = await fetch(`/api/ratings?sopId=${sopId}`);
        const data = await response.json();
        
        if (response.ok) {
          setAverage(data.average || 0);
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [sopId]);

  if (loading || count === 0) {
    return null;
  }

  return (
    <div className={className}>
      <RatingStars 
        rating={average} 
        size="sm" 
        showValue={true}
      />
      <span className="text-xs text-gray-500 ml-1">
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
