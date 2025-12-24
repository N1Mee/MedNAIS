'use client';

import { Step } from './types';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Clock, Youtube, Image, HelpCircle, MoreVertical } from 'lucide-react';

interface StepsListProps {
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onAddStep: () => void;
  onDeleteStep: (stepId: string) => void;
}

export function StepsList({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onDeleteStep,
}: StepsListProps) {
  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = steps.reduce((sum, step) => sum + (step.timerSeconds || 0), 0);

  return (
    <div className="h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Steps</h2>
        <Button onClick={onAddStep} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Step
        </Button>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No steps yet.</p>
            <p className="text-sm mt-1">Add your first step.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`
                  group flex items-center gap-2 p-3 rounded-lg cursor-pointer
                  transition-colors
                  ${selectedStepId === step.id 
                    ? 'bg-blue-50 border-l-4 border-blue-600' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }
                `}
              >
                {/* Drag Handle */}
                <button className="text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-4 w-4" />
                </button>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">
                    Step {step.index + 1}
                  </div>
                  <div className="font-medium text-sm truncate">
                    {step.title || 'Untitled step'}
                  </div>

                  {/* Meta Icons */}
                  <div className="flex items-center gap-2 mt-1">
                    {step.timerSeconds && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(step.timerSeconds)}
                      </div>
                    )}
                    {step.youtubeUrl && (
                      <Youtube className="h-3 w-3 text-red-600" />
                    )}
                    {step.imageUrl && (
                      <Image className="h-3 w-3 text-blue-600" />
                    )}
                    {step.yesNoQuestionEnabled && (
                      <HelpCircle className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </div>

                {/* More Button */}
                <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {steps.length > 0 && (
        <div className="p-3 border-t text-xs text-gray-600">
          {steps.length} steps · Total duration: {formatTime(totalDuration)}
        </div>
      )}
    </div>
  );
}
