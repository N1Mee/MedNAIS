// SOP Types
export type Step = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // Legacy single image
  images?: string[]; // Multiple images
  videoUrl?: string; // YouTube URL
  duration?: number; // minutes
  countdownSeconds?: number; // Countdown timer in seconds
  question?: string; // Optional yes/no question
  questionType?: 'yes_no' | null;
  order?: number;
};

export type Attachment = {
  name: string;
  cloud_storage_path: string;
  size: number;
  type: string;
};

export type SOP = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string; // Main SOP image
  attachments?: Attachment[]; // Additional document attachments
  categoryId?: string;
  authorId: string;
  visibility: string;
  steps?: Step[];
  createdAt: Date;
  updatedAt: Date;
};

export type SOPSession = {
  id: string;
  userId: string;
  sopId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  totalDuration: number; // seconds
  startedAt: Date;
  completedAt?: Date;
};

export type SessionStep = {
  id: string;
  sessionId: string;
  stepId: string;
  timeSpent: number; // seconds
  answer?: string; // yes/no answer
  startedAt: Date;
  completedAt?: Date;
};

export type Rating = {
  id: string;
  userId: string;
  sopId: string;
  rating: number; // 1-5 stars
  review?: string;
  createdAt: Date;
};

export type Comment = {
  id: string;
  userId: string;
  sopId: string;
  content: string;
  createdAt: Date;
  user?: {
    id: string;
    name?: string;
    image?: string;
  };
};

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};