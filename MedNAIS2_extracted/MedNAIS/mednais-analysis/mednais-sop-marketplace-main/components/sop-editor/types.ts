export interface Step {
  id: string;
  index: number;
  title: string;
  description: string;
  youtubeUrl?: string;
  timerSeconds?: number;
  imageUrl?: string;
  references?: string[];
  yesNoQuestionEnabled: boolean;
  yesNoQuestion?: string;
}

export interface StepListItemProps {
  step: Step;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export interface StepEditorProps {
  step: Step | null;
  steps: Step[];
  onUpdate: (updates: Partial<Step>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}
