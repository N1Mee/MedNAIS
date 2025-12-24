'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StepsList } from '@/components/sop-editor/StepsList';
import { StepEditor } from '@/components/sop-editor/StepEditor';
import { TopBar } from '@/components/sop-editor/TopBar';
import { Step } from '@/components/sop-editor/types';
import { toast } from 'sonner';

export default function EditSOPPageV2() {
  const params = useParams();
  const sopId = params?.id as string;

  const [sopTitle, setSopTitle] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load SOP data
  useEffect(() => {
    const loadSOP = async () => {
      try {
        const response = await fetch(`/api/sops/${sopId}`);
        if (!response.ok) {
          throw new Error('Failed to load SOP');
        }

        const sop = await response.json();
        setSopTitle(sop.title);

        // Convert existing steps to new format
        const convertedSteps: Step[] = sop.steps.map((step: any, index: number) => ({
          id: step.id,
          index,
          title: step.title,
          description: step.description,
          youtubeUrl: step.youtubeUrl,
          timerSeconds: step.timerSeconds,
          imageUrl: step.imageUrl,
          references: step.references || [],
          yesNoQuestionEnabled: !!step.question,
          yesNoQuestion: step.question,
        }));

        setSteps(convertedSteps);
        
        // Select first step if exists
        if (convertedSteps.length > 0) {
          setSelectedStepId(convertedSteps[0].id);
        }
      } catch (error) {
        console.error('Load SOP error:', error);
        toast.error('Failed to load SOP');
      } finally {
        setIsLoading(false);
      }
    };

    loadSOP();
  }, [sopId]);

  const addStep = () => {
    const newStep: Step = {
      id: crypto.randomUUID(),
      index: steps.length,
      title: '',
      description: '',
      yesNoQuestionEnabled: false,
      references: [],
    };

    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    toast.success('Step added');
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    const newSteps = steps.filter(s => s.id !== stepId);
    
    // Reindex
    newSteps.forEach((step, index) => {
      step.index = index;
    });

    setSteps(newSteps);

    // Select next available step
    if (selectedStepId === stepId) {
      setSelectedStepId(newSteps.length > 0 ? newSteps[0].id : null);
    }

    toast.success('Step deleted');
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    // Reindex
    newSteps.forEach((step, idx) => {
      step.index = idx;
    });

    setSteps(newSteps);
  };

  const navigateStep = (direction: 'next' | 'previous') => {
    const currentIndex = steps.findIndex(s => s.id === selectedStepId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < steps.length) {
      setSelectedStepId(steps[newIndex].id);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Convert steps back to API format
      const apiSteps = steps.map((step, index) => ({
        id: step.id,
        order: index + 1,
        title: step.title,
        description: step.description,
        youtubeUrl: step.youtubeUrl,
        timerSeconds: step.timerSeconds,
        imageUrl: step.imageUrl,
        references: step.references,
        question: step.yesNoQuestionEnabled ? step.yesNoQuestion : undefined,
      }));

      const response = await fetch(`/api/sops/${sopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sopTitle,
          steps: apiSteps,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast.success('SOP saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save SOP');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    console.log('Current steps:', steps);
    toast.info('Preview feature coming soon');
  };

  const selectedStep = steps.find(s => s.id === selectedStepId) || null;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SOP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        sopTitle={sopTitle}
        onSave={handleSave}
        onPreview={handlePreview}
        isSaving={isSaving}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Steps List */}
        <div className="w-[35%] border-r overflow-hidden">
          <StepsList
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onAddStep={addStep}
            onDeleteStep={deleteStep}
          />
        </div>

        {/* Right Column: Step Editor */}
        <div className="flex-1 overflow-hidden">
          <StepEditor
            step={selectedStep}
            steps={steps}
            onUpdate={(updates) => selectedStepId && updateStep(selectedStepId, updates)}
            onNext={() => navigateStep('next')}
            onPrevious={() => navigateStep('previous')}
            onMoveUp={() => selectedStepId && moveStep(selectedStepId, 'up')}
            onMoveDown={() => selectedStepId && moveStep(selectedStepId, 'down')}
            onDelete={() => selectedStepId && deleteStep(selectedStepId)}
          />
        </div>
      </div>
    </div>
  );
}
