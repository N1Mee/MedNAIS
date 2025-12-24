
'use client';

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageLayout } from "@/components/layout/page-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  ArrowUp, 
  ArrowDown,
  Youtube,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { isValidYouTubeUrl } from "@/lib/youtube";
import { formatTime } from "@/lib/timer";

interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  imageFile?: File;
  youtubeUrl?: string;
  timerSeconds?: number;
  references?: string[];
  question?: string;
}

interface SOPFormData {
  title: string;
  description: string;
  type: 'PERSONAL' | 'GROUP' | 'MARKETPLACE';
  price?: number;
  groupId?: string;
  categoryId?: string;
}

export default function CreateSOPPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<SOPFormData>({
    title: '',
    description: '',
    type: 'PERSONAL'
  });
  
  const [steps, setSteps] = useState<SOPStep[]>([
    {
      id: crypto.randomUUID(),
      order: 1,
      title: '',
      description: '',
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Array<{id: string, name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [isGeneratingFromFile, setIsGeneratingFromFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [generatedStepsPreview, setGeneratedStepsPreview] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState(`Analyze this document and create SOP steps.

Each step should have:
- A clear, concise title (max 60 characters)
- Detailed description of what to do
- Optional timer in seconds if the step requires specific timing
- Optional references or notes

Create 3-15 steps depending on complexity.
Be specific and actionable.
Include timing when relevant.
Make it easy to follow.

Return ONLY a valid JSON array in this format:
[
  {
    "title": "Step title",
    "description": "Detailed description",
    "timerSeconds": 300,
    "references": ["Reference 1"]
  }
]`);

  // Format seconds to readable time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`.trim();
    } else {
      return `${secs}s`;
    }
  };

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Generate SOP from uploaded file
  const handleGenerateFromFile = async () => {
    if (!uploadedFile) {
      toast.error('Please upload a document first');
      return;
    }

    setIsGeneratingFromFile(true);
    setGeneratedStepsPreview('');
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('customPrompt', customPrompt);
      
      toast.loading('Analyzing document with AI...', { id: 'generating' });
      
      const response = await fetch('/api/sops/generate-from-file', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate SOP';
        try {
          const error = await response.json();
          errorMessage = error.details || error.error || errorMessage;
        } catch (e) {
          // Response is not JSON, try to get text
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const { steps: generatedSteps } = await response.json();
      
      // Create preview text
      const previewText = generatedSteps.map((step: any, index: number) => 
        `${index + 1}. ${step.title}\n   ${step.description}${step.timerSeconds ? ` (⏱️ ${formatTime(step.timerSeconds)})` : ''}`
      ).join('\n\n');
      
      setGeneratedStepsPreview(previewText);
      
      // Convert generated steps to our format and add to configurator
      const newSteps = generatedSteps.map((step: any, index: number) => ({
        id: crypto.randomUUID(),
        order: index + 1,
        title: step.title || `Step ${index + 1}`,
        description: step.description || '',
        timerSeconds: step.timerSeconds || undefined,
        references: step.references || undefined
      }));
      
      setSteps(newSteps);
      toast.success(`Generated ${newSteps.length} steps! Review and edit below.`, { id: 'generating' });
      
    } catch (error) {
      console.error('Error generating from file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate SOP', { id: 'generating' });
    } finally {
      setIsGeneratingFromFile(false);
    }
  };

  // Load user's groups when type changes to GROUP
  const loadGroups = useCallback(async () => {
    if (formData.type === 'GROUP') {
      try {
        const response = await fetch('/api/groups/user-groups');
        if (response.ok) {
          const userGroups = await response.json();
          setGroups(userGroups);
        }
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    }
  }, [formData.type]);
  
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const addStep = () => {
    const newStep: SOPStep = {
      id: crypto.randomUUID(),
      order: steps.length + 1,
      title: '',
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    if (steps.length === 1) {
      toast.error("SOP must have at least one step");
      return;
    }
    
    const newSteps = steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));
    setSteps(newSteps);
  };

  const updateStep = (stepId: string, updates: Partial<SOPStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newSteps[currentIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[currentIndex]];
    
    // Update order numbers
    newSteps.forEach((step, index) => {
      step.order = index + 1;
    });
    
    setSteps(newSteps);
  };

  const validateYouTubeUrl = (url: string) => {
    if (!url) return true;
    return isValidYouTubeUrl(url);
  };

  const formatTimerInput = (value: string): number | undefined => {
    if (!value) return undefined;
    
    // Parse MM:SS or just seconds
    const parts = value.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else {
      return parseInt(value) || undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to create SOPs");
      return;
    }

    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    if (steps.some(step => !step.title.trim() || !step.description.trim())) {
      toast.error("All steps must have a title and description");
      return;
    }

    if (formData.type === 'MARKETPLACE' && (!formData.price || formData.price <= 0)) {
      toast.error("Marketplace SOPs must have a valid price");
      return;
    }

    if (formData.type === 'GROUP' && !formData.groupId) {
      toast.error("Please select a group for group SOPs");
      return;
    }

    // Validate YouTube URLs
    for (const step of steps) {
      if (step.youtubeUrl && !validateYouTubeUrl(step.youtubeUrl)) {
        toast.error(`Invalid YouTube URL in step: ${step.title}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Prepare steps data without files
      const stepsData = steps.map(({ id, imageFile, ...step }) => step);

      // Add SOP data
      formDataToSend.append('data', JSON.stringify({
        ...formData,
        price: formData.type === 'MARKETPLACE' ? Math.round((formData.price || 0) * 100) : undefined, // Convert to cents
        steps: stepsData
      }));

      // Add files
      steps.forEach((step, index) => {
        if (step.imageFile) {
          formDataToSend.append(`step-${index}-image`, step.imageFile);
        }
      });

      const response = await fetch('/api/sops', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create SOP');
      }

      const newSOP = await response.json();
      toast.success("SOP created successfully!");
      router.push(`/sops/${newSOP.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create SOP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader 
        title="Create SOP"
        description="Create a new Standard Operating Procedure with step-by-step instructions"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* AI Generation from File */}
          <Card className="bg-gradient-to-r from-[#E63946]/5 to-[#D62839]/5 border-2 border-[#E63946]/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#E63946]">✨</span> Generate SOP from Document (AI-Powered)
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="text-xs"
                >
                  {showPromptEditor ? 'Hide' : 'Customize'} AI Prompt
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a PDF, Word document, Excel file, or image and let AI create SOP steps for you automatically.
                You can edit and refine the generated steps afterwards.
              </p>

              {/* Custom Prompt Editor */}
              {showPromptEditor && (
                <div className="space-y-2 p-4 bg-background rounded-lg border border-border">
                  <Label htmlFor="custom-prompt" className="text-sm font-semibold">
                    AI Prompt Instructions
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-xs"
                    placeholder="Enter custom instructions for AI..."
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Customize this prompt to guide the AI on how to structure your SOP steps. 
                    For example, add industry-specific requirements or formatting preferences.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCustomPrompt(`Analyze this document and create SOP steps.

Each step should have:
- A clear, concise title (max 60 characters)
- Detailed description of what to do
- Optional timer in seconds if the step requires specific timing
- Optional references or notes

Create 3-15 steps depending on complexity.
Be specific and actionable.
Include timing when relevant.
Make it easy to follow.

Return ONLY a valid JSON array in this format:
[
  {
    "title": "Step title",
    "description": "Detailed description",
    "timerSeconds": 300,
    "references": ["Reference 1"]
  }
]`)}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="file-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-[#E63946]/30 rounded-lg hover:border-[#E63946] hover:bg-[#E63946]/5 transition-all">
                    {uploadedFile ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{uploadedFile.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadedFile(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-[#E63946]" />
                        <span className="text-sm font-medium">
                          {isGeneratingFromFile ? 'Analyzing document...' : 'Click to upload document'}
                        </span>
                      </>
                    )}
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        toast.success(`File "${file.name}" uploaded. Click "Generate SOP" to analyze.`);
                      }
                    }}
                    disabled={isGeneratingFromFile}
                  />
                </Label>
              </div>
              
              {/* Custom Prompt Editor */}
              {uploadedFile && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="custom-prompt">AI Instructions (optional)</Label>
                    <Textarea
                      id="custom-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Add specific instructions for AI to follow..."
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: "Focus on safety procedures" or "Include detailed time estimates"
                    </p>
                  </div>

                  {/* Generate Button */}
                  <Button
                    type="button"
                    onClick={handleGenerateFromFile}
                    disabled={isGeneratingFromFile}
                    className="w-full bg-[#E63946] hover:bg-[#D62839]"
                  >
                    {isGeneratingFromFile ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        Analyzing document...
                      </>
                    ) : (
                      <>
                        <span>✨ Generate SOP Steps</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Generated Steps Preview */}
              {generatedStepsPreview && (
                <div className="space-y-2">
                  <Label>Generated Steps Preview</Label>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-2">
                      ✅ {steps.length} steps generated and added to configurator below
                    </p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {generatedStepsPreview}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These steps have been automatically added to the configurator. Scroll down to edit them.
                  </p>
                </div>
              )}

              {isGeneratingFromFile && (
                <div className="flex items-center justify-center gap-2 p-4 bg-[#E63946]/10 rounded-lg">
                  <LoadingSpinner className="h-5 w-5" />
                  <span className="text-sm text-[#E63946] font-medium">
                    AI is analyzing your document... This may take 30-60 seconds.
                  </span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Images (.png, .jpg), Text (.txt)
              </p>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter SOP title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this SOP covers"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Select 
                  value={formData.categoryId || "none"} 
                  onValueChange={(value) => {
                    if (value === 'suggest_new') {
                      setSuggestingCategory(true);
                    } else if (value === 'none') {
                      setFormData({ ...formData, categoryId: undefined });
                    } else {
                      setFormData({ ...formData, categoryId: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map(category => (
                      <>
                        <SelectItem key={category.id} value={category.id} className="font-semibold">
                          📁 {category.name}
                        </SelectItem>
                        {category.subcategories && category.subcategories.map((sub: any) => (
                          <SelectItem key={sub.id} value={sub.id} className="pl-8 text-sm">
                            └─ {sub.name.replace(`${category.name} - `, '')}
                          </SelectItem>
                        ))}
                      </>
                    ))}
                    <SelectItem value="suggest_new" className="text-[#E63946] font-medium mt-2 border-t">
                      ✨ Suggest new category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {suggestingCategory && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={async () => {
                        if (!newCategoryName.trim()) {
                          toast.error('Enter category name');
                          return;
                        }
                        try {
                          const response = await fetch('/api/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              name: newCategoryName, 
                              isSuggestion: true 
                            }),
                          });
                          if (response.ok) {
                            toast.success('Suggestion submitted! Thank you for your contribution.');
                            setNewCategoryName('');
                            setSuggestingCategory(false);
                          }
                        } catch (error) {
                          toast.error('Failed to submit suggestion');
                        }
                      }}
                    >
                      Submit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSuggestingCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'PERSONAL' | 'GROUP' | 'MARKETPLACE') => {
                      setFormData({ 
                        ...formData, 
                        type: value, 
                        groupId: value === 'GROUP' ? formData.groupId : undefined,
                        price: value === 'MARKETPLACE' ? formData.price : undefined
                      });
                      if (value === 'GROUP') {
                        loadGroups();
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal - Only for me</SelectItem>
                      <SelectItem value="GROUP">Group - Share with team</SelectItem>
                      <SelectItem value="MARKETPLACE">Marketplace - Sell to others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'GROUP' && (
                  <div>
                    <Label htmlFor="group">Group</Label>
                    <Select 
                      value={formData.groupId || ""} 
                      onValueChange={(value) => setFormData({ ...formData, groupId: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.type === 'MARKETPLACE' && (
                  <div>
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                      placeholder="9.99"
                      required={formData.type === 'MARKETPLACE'}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Steps ({steps.length})</CardTitle>
                <Button type="button" onClick={addStep} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">Step {step.order}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        disabled={steps.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Step Title *</Label>
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, { title: e.target.value })}
                        placeholder="What needs to be done?"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={step.description}
                        onChange={(e) => updateStep(step.id, { description: e.target.value })}
                        placeholder="Detailed instructions for this step"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <Label>YouTube URL (Optional)</Label>
                      <div className="relative">
                        <Youtube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={step.youtubeUrl || ''}
                          onChange={(e) => updateStep(step.id, { youtubeUrl: e.target.value || undefined })}
                          placeholder="https://youtube.com/watch?v=..."
                          className="pl-10"
                        />
                      </div>
                      {step.youtubeUrl && !validateYouTubeUrl(step.youtubeUrl) && (
                        <p className="text-sm text-red-600 mt-1">Invalid YouTube URL</p>
                      )}
                    </div>

                    <div>
                      <Label>Timer (Optional)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={step.timerSeconds ? formatTime(step.timerSeconds) : ''}
                          onChange={(e) => {
                            const seconds = formatTimerInput(e.target.value);
                            updateStep(step.id, { timerSeconds: seconds });
                          }}
                          placeholder="5:00 or 300"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Format: MM:SS or seconds (e.g., "5:30" or "330")
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Image (Optional)</Label>
                      <ImageUpload
                        value={step.imageFile}
                        onChange={(val) => updateStep(step.id, { imageFile: val instanceof File ? val : undefined })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>References (Sources) (Optional)</Label>
                      <Textarea
                        value={step.references?.join('\n') || ''}
                        onChange={(e) => {
                          const refs = e.target.value
                            .split('\n')
                            .map(r => r.trim())
                            .filter(r => r.length > 0);
                          updateStep(step.id, { 
                            references: refs.length > 0 ? refs : undefined 
                          });
                        }}
                        placeholder="Enter links to sources (one per line)&#10;https://example.com/source1&#10;https://example.com/source2"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add links to sources on which this step is based (one per line)
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Question (Yes/No Question) (Optional)</Label>
                      <Input
                        value={step.question || ''}
                        onChange={(e) => updateStep(step.id, { question: e.target.value || undefined })}
                        placeholder="For example: Are all ingredients ready?"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add a question that the user must answer "Yes" or "No" when completing this step
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create SOP
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
