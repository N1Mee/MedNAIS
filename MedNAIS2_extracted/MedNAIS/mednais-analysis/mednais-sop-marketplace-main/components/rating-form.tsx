"use client";

import { useState } from 'react';
import { RatingStars } from './rating-stars';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { toast } from 'sonner';

interface RatingFormProps {
  sopId: string;
  existingRating?: {
    rating: number;
    comment?: string;
  };
  onSuccess?: () => void;
}

export function RatingForm({ sopId, existingRating, onSuccess }: RatingFormProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId,
          rating,
          comment: comment.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      toast.success(existingRating ? 'Rating updated!' : 'Rating submitted!');
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <RatingStars
          rating={rating}
          interactive
          onRatingChange={setRating}
          showValue={false}
          size="lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment (optional)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this SOP..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="bg-[#E63946] hover:bg-[#D62839] text-white w-full"
      >
        {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
      </Button>
    </form>
  );
}
