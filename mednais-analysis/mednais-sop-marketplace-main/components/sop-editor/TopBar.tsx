'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  sopTitle: string;
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
}

export function TopBar({ sopTitle, onSave, onPreview, isSaving }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-gray-900">
          {sopTitle || 'Untitled SOP'}
        </h1>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
