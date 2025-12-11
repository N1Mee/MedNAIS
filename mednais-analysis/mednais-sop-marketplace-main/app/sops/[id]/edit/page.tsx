
'use client';

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  imageId?: string;
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

export default function EditSOPPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sopId = params?.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<SOPFormData>({
    title: '',
    description: '',
    type: 'PERSONAL'
  });
  
  const [steps, setSteps] = useState<SOPStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Array<{id: string, name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  // Load SOP data
  useEffect(() => {
    const loadSOP = async () => {
      try {
        const response = await fetch(`/api/sops/${sopId}`);
        if (!response.ok) {
          throw new Error('Failed to load SOP');
        }
        
        const sop = await response.json();
        
        // Check if user is the creator
        if (sop.creatorId !== user?.id) {
          toast.error("You don't have permission to edit this SOP");
          router.push(`/sops/${sopId}`);
          return;
        }

        // Set form data
        setFormData({
          title: sop.title,
          description: sop.description,
          type: sop.type,
          price: sop.price ? sop.price / 100 : undefined,
          groupId: sop.groupId || undefined,
          categoryId: sop.categoryId || undefined,
        });

        // Set steps with proper parsing of references
        setSteps(sop.steps.map((step: any) => ({
          id: step.id,
          order: step.order,
          title: step.title,
          description: step.description,
          imageId: step.imageId || undefined,
          youtubeUrl: step.youtubeUrl || undefined,
          timerSeconds: step.timerSeconds || undefined,
          references: step.references ? JSON.parse(step.references) : undefined,
          question: step.question || undefined,
        })));

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load SOP:', error);
        toast.error('Failed to load SOP');
        router.push('/dashboard');
      }
    };

    if (sopId && user?.id) {
      loadSOP();
    }
  }, [sopId, user?.id, router]);

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

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (response.ok) {
      const { cloudStoragePath } = await response.json();
      return cloudStoragePath;
    } else {
      throw new Error('Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to edit SOPs");
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
      const response = await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.type === 'MARKETPLACE' ? Math.round((formData.price || 0) * 100) : null,
          steps: steps.map((step) => ({
            id: step.id.startsWith('temp-') ? undefined : step.id, // New steps won't have real IDs
            order: step.order,
            title: step.title,
            description: step.description,
            imageId: step.imageId || null,
            youtubeUrl: step.youtubeUrl || null,
            timerSeconds: step.timerSeconds || null,
            references: step.references || null,
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update SOP');
      }

      const updatedSOP = await response.json();
      toast.success("SOP updated successfully!");
      router.push(`/sops/${updatedSOP.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update SOP");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      
      
      <PageHeader 
        title="Edit SOP"
        description="Update your Standard Operating Procedure"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
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
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="suggest_new" className="text-blue-600 font-medium">
                      + Suggest new category
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
                      value={formData.groupId || "no-group"} 
                      onValueChange={(value) => setFormData({ ...formData, groupId: value === "no-group" ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-group">Select a group</SelectItem>
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
                        value={step.imageId ? `/api/assets/${ encodeURIComponent(step.imageId) }` : undefined}
                        onChange={(val) => {
                          if (val instanceof File) {
                            uploadImage(val).then(key => updateStep(step.id, { imageId: key })).catch(error => toast.error('Upload failed'));
                          } else {
                            updateStep(step.id, { imageId: undefined });
                          }
                        }}
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
              onClick={() => router.push(`/sops/${sopId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update SOP
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
