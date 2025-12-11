'use client';

import { Step } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Trash2,
  Upload
} from 'lucide-react';

interface StepEditorProps {
  step: Step | null;
  steps: Step[];
  onUpdate: (updates: Partial<Step>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function StepEditor({
  step,
  steps,
  onUpdate,
  onNext,
  onPrevious,
  onMoveUp,
  onMoveDown,
  onDelete,
}: StepEditorProps) {
  if (!step) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">Select a step from the list or create a new one.</p>
          {steps.length === 0 && (
            <p className="text-sm mt-2">No steps yet. Add your first step.</p>
          )}
        </div>
      </div>
    );
  }

  const isFirst = step.index === 0;
  const isLast = step.index === steps.length - 1;

  const parseTimer = (value: string): number => {
    if (!value) return 0;
    
    // Try MM:SS format
    if (value.includes(':')) {
      const [mins, secs] = value.split(':').map(Number);
      return (mins || 0) * 60 + (secs || 0);
    }
    
    // Otherwise treat as seconds
    return parseInt(value) || 0;
  };

  const formatTimer = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Step Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Step {step.index + 1}</div>
            <h2 className="text-2xl font-bold">
              {step.title || 'New step'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={isFirst}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={isLast}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete step"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-green-600">All changes saved</div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Section A: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic info</h3>
          
          <div className="space-y-2">
            <Label htmlFor="step-title">
              Step Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="step-title"
              placeholder="What needs to be done?"
              value={step.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="step-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="step-description"
              placeholder="Detailed instructions for this step"
              value={step.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Section B: Media & Timing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Media & Timing</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL (optional)</Label>
              <Input
                id="youtube-url"
                placeholder="https://youtube.com/watch?v=..."
                value={step.youtubeUrl || ''}
                onChange={(e) => onUpdate({ youtubeUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timer">Timer (optional)</Label>
              <Input
                id="timer"
                placeholder="5:00 or 300"
                value={formatTimer(step.timerSeconds)}
                onChange={(e) => onUpdate({ timerSeconds: parseTimer(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                Format: MM:SS or seconds (e.g., "5:30" or "330")
              </p>
            </div>
          </div>
        </div>

        {/* Section C: Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Image (optional)</h3>
          
          {!step.imageUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Drop image here or browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <img
                src={step.imageUrl}
                alt="Step preview"
                className="max-h-40 rounded-lg"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Replace image</Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onUpdate({ imageUrl: undefined })}
                >
                  Remove image
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Section D: References */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">References (sources) (optional)</h3>
          <Textarea
            placeholder="Enter links to sources (one per line)"
            value={step.references?.join('\n') || ''}
            onChange={(e) => onUpdate({ references: e.target.value.split('\n').filter(Boolean) })}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Add links to sources on which this step is based (one per line).
          </p>
        </div>

        {/* Section E: Yes/No Question */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Yes/No question (optional)</h3>
            <Switch
              checked={step.yesNoQuestionEnabled}
              onCheckedChange={(checked) => onUpdate({ 
                yesNoQuestionEnabled: checked,
                yesNoQuestion: checked ? step.yesNoQuestion : undefined
              })}
            />
          </div>
          
          {step.yesNoQuestionEnabled && (
            <div className="space-y-2">
              <Label htmlFor="yes-no-question">Question</Label>
              <Input
                id="yes-no-question"
                placeholder="For example: Are all ingredients ready?"
                value={step.yesNoQuestion || ''}
                onChange={(e) => onUpdate({ yesNoQuestion: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                User must answer "Yes" or "No" when completing this step.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete step
        </Button>

        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
