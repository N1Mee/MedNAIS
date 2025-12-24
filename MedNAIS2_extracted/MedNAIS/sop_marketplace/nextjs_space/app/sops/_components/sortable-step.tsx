
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash, Clock, Youtube, Timer, HelpCircle, X, Plus, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useState } from "react";

interface SortableStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    images?: string[];
    videoUrl?: string;
    duration?: number;
    countdownSeconds?: number;
    question?: string;
    questionType?: 'yes_no' | null;
  };
  index: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}

export function SortableStep({
  step,
  index,
  onUpdate,
  onDelete,
}: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: step.id });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addImage = () => {
    const currentImages = step.images || [];
    onUpdate(step.id, "images", [...currentImages, ""]);
  };

  const updateImage = (imageIndex: number, value: string) => {
    const currentImages = step.images || [];
    const newImages = [...currentImages];
    newImages[imageIndex] = value;
    onUpdate(step.id, "images", newImages);
  };

  const removeImage = (imageIndex: number) => {
    const currentImages = step.images || [];
    const newImages = currentImages.filter((_, idx) => idx !== imageIndex);
    onUpdate(step.id, "images", newImages);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-[#E63946]/50 transition"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Step Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E63946] text-white flex items-center justify-center font-bold text-sm mt-2">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <input
            type="text"
            value={step.title}
            onChange={(e) => onUpdate(step.id, "title", e.target.value)}
            placeholder="Step title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 font-medium"
          />

          {/* Description */}
          <textarea
            value={step.description}
            onChange={(e) => onUpdate(step.id, "description", e.target.value)}
            placeholder="Step description (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 text-sm"
          />

          {/* Duration */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={step.duration || ""}
              onChange={(e) =>
                onUpdate(
                  step.id,
                  "duration",
                  e.target.value ? parseInt(e.target.value) : ""
                )
              }
              placeholder="Duration"
              min="0"
              className="w-28 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 text-sm"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
          </div>

          {/* Multiple Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images
              </label>
              <button
                type="button"
                onClick={addImage}
                className="text-sm text-[#E63946] hover:text-[#E63946]/80 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Image
              </button>
            </div>
            
            {step.images && step.images.length > 0 ? (
              <div className="space-y-2">
                {step.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <ImageUpload
                      value={img}
                      onChange={(value) => updateImage(idx, value)}
                      onRemove={() => removeImage(idx)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No images added yet</p>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-[#E63946] hover:text-[#E63946]/80 font-medium"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-gray-300 dark:border-gray-600">
              {/* YouTube Video URL */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-600" />
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={step.videoUrl || ""}
                  onChange={(e) => onUpdate(step.id, "videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 text-sm"
                />
              </div>

              {/* Countdown Timer */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  Countdown Timer (seconds)
                </label>
                <input
                  type="number"
                  value={step.countdownSeconds || ""}
                  onChange={(e) =>
                    onUpdate(
                      step.id,
                      "countdownSeconds",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 300 (5 minutes)"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 text-sm"
                />
                <p className="text-xs text-gray-500">
                  Set a countdown timer that users must wait through
                </p>
              </div>

              {/* Yes/No Question */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  Yes/No Question
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id={`question-${step.id}`}
                    checked={step.questionType === 'yes_no'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdate(step.id, "questionType", "yes_no");
                        if (!step.question) {
                          onUpdate(step.id, "question", "");
                        }
                      } else {
                        onUpdate(step.id, "questionType", null);
                        onUpdate(step.id, "question", null);
                      }
                    }}
                    className="w-4 h-4 text-[#E63946] border-gray-300 rounded focus:ring-[#E63946]"
                  />
                  <label htmlFor={`question-${step.id}`} className="text-sm">
                    Add a yes/no question for this step
                  </label>
                </div>
                {step.questionType === 'yes_no' && (
                  <input
                    type="text"
                    value={step.question || ""}
                    onChange={(e) => onUpdate(step.id, "question", e.target.value)}
                    placeholder="e.g., Did you complete this step correctly?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-800 text-sm"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(step.id)}
          className="mt-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
