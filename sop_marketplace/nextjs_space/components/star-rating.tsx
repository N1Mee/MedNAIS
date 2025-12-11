
"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showNumber = false,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const displayRating = hoveredRating || rating;

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            disabled={readonly}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
