"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  interactive = false,
  onRatingChange,
  className = ''
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);
        const isPartial = starValue > rating && starValue - 1 < rating;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(starValue)}
            disabled={!interactive}
            className={cn(
              'relative',
              interactive && 'cursor-pointer hover:scale-110 transition-transform',
              !interactive && 'cursor-default'
            )}
          >
            {isPartial ? (
              <div className="relative">
                <Star className={cn(sizeClasses[size], 'text-gray-300')} fill="currentColor" />
                <div 
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${(rating - (starValue - 1)) * 100}%` }}
                >
                  <Star className={cn(sizeClasses[size], 'text-yellow-400')} fill="currentColor" />
                </div>
              </div>
            ) : (
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled ? 'text-yellow-400' : 'text-gray-300'
                )}
                fill="currentColor"
              />
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
