"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RatingForm } from './rating-form';
import { RatingsList } from './ratings-list';
import { RatingStars } from './rating-stars';
import { Star, MessageSquare } from 'lucide-react';

interface SOPRatingsSectionProps {
  sopId: string;
  canRate: boolean;
  isPurchased: boolean;
  isOwner: boolean;
}

export function SOPRatingsSection({ 
  sopId, 
  canRate, 
  isPurchased,
  isOwner 
}: SOPRatingsSectionProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    setRefreshKey(prev => prev + 1); // Trigger re-render of RatingsList
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Ratings & Reviews
          </CardTitle>
          
          {canRate && !isOwner && (
            <Button
              onClick={() => setShowRatingForm(!showRatingForm)}
              variant={showRatingForm ? "outline" : "default"}
              className={!showRatingForm ? "bg-[#E63946] hover:bg-[#D62839] text-white" : ""}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showRatingForm ? 'Cancel' : 'Write a Review'}
            </Button>
          )}
        </div>
        
        {!canRate && !isPurchased && !isOwner && (
          <p className="text-sm text-gray-500 mt-2">
            Purchase this SOP to leave a review
          </p>
        )}
        
        {isOwner && (
          <p className="text-sm text-gray-500 mt-2">
            You cannot rate your own SOP
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {showRatingForm && (
          <div className="border-b pb-6">
            <RatingForm 
              sopId={sopId} 
              onSuccess={handleRatingSuccess}
            />
          </div>
        )}
        
        <RatingsList key={refreshKey} sopId={sopId} />
      </CardContent>
    </Card>
  );
}
