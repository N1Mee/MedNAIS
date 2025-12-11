
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableStep } from "./sortable-step";
import { PlusCircle, Save, Loader2, Eye, FileText, Upload, X, Image as ImageIcon, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";

interface Step {
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
}

interface SOPEditorProps {
  sop?: any;
}

export function SOPEditor({ sop }: SOPEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Document generation state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Form state
  const [title, setTitle] = useState(sop?.title || "");
  const [description, setDescription] = useState(sop?.description || "");
  const [price, setPrice] = useState(sop?.price || 0);
  const [imageUrl, setImageUrl] = useState(sop?.imageUrl || "");
  const [attachments, setAttachments] = useState<any[]>(sop?.attachments || []);
  const [categoryId, setCategoryId] = useState(sop?.categoryId || "");
  const [visibility, setVisibility] = useState(sop?.visibility || "public");
  const [steps, setSteps] = useState<Step[]>(
    sop?.steps?.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description || "",
      imageUrl: s.imageUrl || "",
      images: s.images || [],
      videoUrl: s.videoUrl || "",
      duration: s.duration || "",
      countdownSeconds: s.countdownSeconds || undefined,
      question: s.question || "",
      questionType: s.questionType || null,
    })) || []
  );
  const [categories, setCategories] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: `temp-${Date.now()}`,
      title: "",
      description: "",
      imageUrl: "",
      images: [],
      videoUrl: "",
      duration: 0,
      countdownSeconds: undefined,
      question: "",
      questionType: null,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: string, value: any) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  };

  const deleteStep = (id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOCX, or TXT file');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleGenerateFromDocument = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first');
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);

    const toastId = toast.loading('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('language', selectedLanguage);

      console.log('Sending file:', uploadedFile.name, uploadedFile.type, 'Language:', selectedLanguage);
      
      const response = await fetch('/api/sops/generate-from-document', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate steps');
      }

      toast.loading('Generating steps from document...', { id: toastId });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('Stream completed');
              break;
            }

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              console.log('Parsed data:', parsed);
              
              if (parsed.status === 'processing') {
                setGenerationProgress((prev) => Math.min(prev + 5, 95));
              } else if (parsed.status === 'completed') {
                const result = parsed.result;
                console.log('Generation completed:', result);
                
                // Update form with generated data
                if (result.title) {
                  setTitle(result.title);
                  console.log('Set title:', result.title);
                }
                if (result.description) {
                  setDescription(result.description);
                  console.log('Set description');
                }
                if (result.steps && Array.isArray(result.steps)) {
                  const generatedSteps: Step[] = result.steps.map((step: any, index: number) => ({
                    id: `generated-${Date.now()}-${index}`,
                    title: step.title || 'Untitled Step',
                    description: step.description || '',
                    imageUrl: '',
                    images: [],
                    videoUrl: '',
                    duration: step.duration || 0,
                    countdownSeconds: undefined,
                    question: '',
                    questionType: null,
                  }));
                  setSteps(generatedSteps);
                  console.log('Set steps:', generatedSteps.length);
                }

                setGenerationProgress(100);
                toast.success('Steps generated successfully! Review and edit as needed.', { id: toastId });
                setTimeout(() => {
                  setShowDocumentModal(false);
                  setUploadedFile(null);
                  setGenerationProgress(0);
                  setSelectedLanguage('en');
                }, 1500);
                return;
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Generation failed');
              }
            } catch (e) {
              console.error('JSON parse error:', e, 'Data:', data);
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate steps from document', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    // Validate each step has a title
    const emptySteps = steps.filter(s => !s.title?.trim());
    if (emptySteps.length > 0) {
      toast.error("All steps must have a title");
      return;
    }

    // Validate minimum price
    const priceValue = parseFloat(price.toString());
    if (priceValue > 0 && priceValue < 0.01) {
      toast.error("Minimum price is $0.01");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title,
        description,
        price: parseFloat(price.toString()),
        imageUrl: imageUrl || null,
        attachments: attachments.length > 0 ? attachments : null,
        categoryId: categoryId || null,
        visibility,
        steps: steps.map((step) => ({
          title: step.title || "Untitled Step",
          description: step.description,
          imageUrl: step.imageUrl,
          images: step.images || [],
          videoUrl: step.videoUrl || null,
          duration: step.duration ? parseInt(step.duration.toString()) : null,
          countdownSeconds: step.countdownSeconds ? parseInt(step.countdownSeconds.toString()) : null,
          question: step.question || null,
          questionType: step.questionType || null,
        })),
      };

      const url = sop ? `/api/sops/${sop.id}` : "/api/sops";
      const method = sop ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save SOP");
      }

      const savedSOP = await response.json();
      toast.success(sop ? "SOP updated successfully" : "SOP created successfully");
      
      // Clear draft after successful save
      const draftKey = sop ? `sop-draft-${sop.id}` : 'sop-draft-new';
      localStorage.removeItem(draftKey);
      
      router.push(`/sops/${savedSOP.id}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Failed to save SOP");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!title.trim()) {
      toast.error("Please enter a title to preview");
      return;
    }
    if (steps.length === 0) {
      toast.error("Please add at least one step to preview");
      return;
    }
    setShowPreview(true);
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const draftKey = sop ? `sop-draft-${sop.id}` : 'sop-draft-new';
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft && !sop) {
      // Only auto-load for new SOPs
      try {
        const draft = JSON.parse(savedDraft);
        const shouldLoad = window.confirm(
          `Found an unsaved draft from ${new Date(draft.timestamp).toLocaleString()}. Do you want to continue with this draft?`
        );
        
        if (shouldLoad) {
          setTitle(draft.title || "");
          setDescription(draft.description || "");
          setPrice(draft.price || 0);
          setImageUrl(draft.imageUrl || "");
          setCategoryId(draft.categoryId || "");
          setVisibility(draft.visibility || "public");
          setSteps(draft.steps || []);
          toast.success("Draft loaded successfully");
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      // Save to localStorage
      const draftKey = sop ? `sop-draft-${sop.id}` : 'sop-draft-new';
      const draft = {
        title,
        description,
        price,
        imageUrl,
        categoryId,
        visibility,
        steps,
        timestamp: new Date().toISOString(),
      };
      
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setLastAutoSave(new Date());
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 30000); // 30 seconds

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [title, description, price, imageUrl, categoryId, visibility, steps, sop]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <button
              onClick={() => setShowDocumentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#E63946]/80 text-white rounded-lg hover:from-[#E63946]/90 hover:to-[#E63946]/70 transition text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              Generate from Document
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter SOP title"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this SOP covers"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
              />
            </div>

            {/* Main SOP Image */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Main Image (for marketplace display)
              </label>
              <ImageUpload
                value={imageUrl}
                onChange={(value) => setImageUrl(value)}
                onRemove={() => setImageUrl("")}
              />
              <p className="text-xs text-gray-500 mt-1">
                This image will be displayed on the marketplace listing
              </p>
            </div>

            {/* Attachments Section */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Additional Documents & Files
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  id="attachment-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      const formData = new FormData();
                      formData.append("file", file);

                      const response = await fetch("/api/upload-attachment", {
                        method: "POST",
                        body: formData,
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || "Upload failed");
                      }

                      const data = await response.json();
                      setAttachments([...attachments, {
                        name: data.name,
                        cloud_storage_path: data.cloud_storage_path,
                        size: data.size,
                        type: data.type,
                      }]);
                      toast.success("File attached successfully");
                      e.target.value = ""; // Reset input
                    } catch (error: any) {
                      console.error("Upload error:", error);
                      toast.error(error?.message || "Failed to upload file");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("attachment-upload")?.click()}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#E63946] dark:hover:border-[#E63946] transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#E63946]"
                >
                  <Upload className="h-4 w-4" />
                  Attach Document
                </button>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-[#E63946] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachments(attachments.filter((_, i) => i !== index));
                            toast.success("Attachment removed");
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded transition flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload instructions, guides, or reference documents (PDF, DOC, XLS, PPT, TXT, CSV, images - max 10MB)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === null) {
                      setPrice(0);
                    } else {
                      const parsed = parseFloat(val);
                      setPrice(isNaN(parsed) ? 0 : parsed);
                    }
                  }}
                  min="0"
                  step="0.01"
                  placeholder="0.00 (free) or minimum $0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E63946] focus:border-transparent bg-white dark:bg-gray-700"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        {/* Steps Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Steps</h2>
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No steps yet. Click "Add Step" to get started.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      index={index}
                      onUpdate={updateStep}
                      onDelete={deleteStep}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-20">
          <h3 className="font-semibold mb-4">Actions</h3>

          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {sop ? "Update SOP" : "Publish SOP"}
                </>
              )}
            </button>

            <button
              onClick={handlePreview}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              Auto-save: {lastAutoSave 
                ? `Last saved at ${lastAutoSave.toLocaleTimeString()}`
                : "Draft will be saved every 30 seconds"}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4">Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Drag and drop to reorder steps</li>
            <li>• Add images to make steps clearer</li>
            <li>• Include time estimates for each step</li>
            <li>• Use clear, actionable language</li>
            <li>• Test your SOP before publishing</li>
          </ul>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">Generate SOP from Document</h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setUploadedFile(null);
                  setGenerationProgress(0);
                  setSelectedLanguage('en');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                disabled={generating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Upload a document (PDF, DOCX, or TXT) and our AI will automatically extract and structure the steps for you.
                </p>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[#E63946] transition">
                  <input
                    type="file"
                    id="document-upload"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={generating}
                  />
                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-[#E63946]/10 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-[#E63946]" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {uploadedFile ? uploadedFile.name : 'Click to upload document'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF, DOCX, or TXT (max 10MB)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Language selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Output Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={generating}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946] dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                  <option value="nl">Nederlands</option>
                  <option value="pl">Polski</option>
                  <option value="tr">Türkçe</option>
                  <option value="uk">Українська</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The AI will generate SOP content in the selected language
                </p>
              </div>

              {generating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Generating steps...</span>
                    <span className="font-medium text-[#E63946]">{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#E63946] to-[#E63946]/80 h-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setUploadedFile(null);
                    setGenerationProgress(0);
                    setSelectedLanguage('en');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateFromDocument}
                  disabled={!uploadedFile || generating}
                  className="flex-1 px-4 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#E63946]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Steps'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold">Preview: {title || "Untitled SOP"}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* SOP Header */}
              <div>
                {imageUrl && (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h1 className="text-3xl font-bold mb-2">{title || "Untitled SOP"}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {description || "No description provided"}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-[#E63946]">
                    {price > 0 ? `$${parseFloat(price.toString()).toFixed(2)}` : "Free"}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {steps.length} {steps.length === 1 ? "step" : "steps"}
                  </span>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Steps</h2>
                {steps.length === 0 ? (
                  <p className="text-gray-500 italic">No steps added yet</p>
                ) : (
                  steps.map((step, index) => (
                    <div 
                      key={step.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#E63946] text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">
                            {step.title || "Untitled Step"}
                          </h3>
                          {step.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {step.description}
                            </p>
                          )}
                          
                          {/* Step images */}
                          {step.images && step.images.length > 0 && (
                            <div className={`grid gap-2 mb-3 ${step.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {step.images.map((img, idx) => img && (
                                <div key={idx} className="relative w-full h-40 rounded-lg overflow-hidden">
                                  <img 
                                    src={img} 
                                    alt={`Step ${index + 1} image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Legacy single image */}
                          {step.imageUrl && (!step.images || step.images.length === 0) && (
                            <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3">
                              <img 
                                src={step.imageUrl} 
                                alt={`Step ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Video */}
                          {step.videoUrl && (
                            <div className="mb-3">
                              <a 
                                href={step.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                🎥 Video: {step.videoUrl}
                              </a>
                            </div>
                          )}

                          {/* Additional info */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {step.duration && parseInt(step.duration.toString()) > 0 && (
                              <span>⏱️ Duration: {step.duration} min</span>
                            )}
                            {step.countdownSeconds && parseInt(step.countdownSeconds.toString()) > 0 && (
                              <span>⏲️ Countdown: {step.countdownSeconds}s</span>
                            )}
                            {step.question && (
                              <span>❓ Question: {step.question}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
