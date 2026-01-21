import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Modal } from '../components/common/Modal';
import {
  useCourse,
  useCreateCourse,
  useUpdateCourse,
} from '../hooks/useCourses';
import { useBatchCreateModules, useDeleteModule, useModules } from '../hooks/useModules';
import { useSuggestModules, useGenerateModuleContent } from '../hooks/useGeneration';
import { modulesApi } from '../api/modules';
import { ApiError } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/useToast';
import type { CourseDifficulty, CourseInstructions, CourseCreate, CourseUpdate, ModuleSuggestion, ModuleCreate } from '../types';

type Step = 'info' | 'instructions' | 'modules';

interface ModuleOutline {
  id: string;
  title: string;
  description: string;
}

const STEPS: { key: Step; label: string; aiOnly?: boolean }[] = [
  { key: 'info', label: 'Basic Info' },
  { key: 'instructions', label: 'AI Instructions', aiOnly: true },
  { key: 'modules', label: 'Modules' },
];

export function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEditing = !!courseId;

  // Fetch existing course data if editing
  const { data: existingCourse, isLoading: loadingCourse } = useCourse(courseId || '');
  const { data: existingModules } = useModules(courseId || '');
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const suggestModules = useSuggestModules();
  const batchCreateModules = useBatchCreateModules();
  const deleteModule = useDeleteModule();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('info');

  // Basic info state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('beginner');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);

  // AI Instructions state
  const [instructions, setInstructions] = useState<CourseInstructions>({
    purpose: '',
    target_audience: '',
    learning_objectives: [''],
    tone: '',
    additional_context: undefined,
  });

  // Module outlines state
  const [moduleOutlines, setModuleOutlines] = useState<ModuleOutline[]>([]);

  // AI Suggestion Modal state
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ModuleSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [suggestionMode, setSuggestionMode] = useState<'add' | 'replace' | null>(null);
  const [isCreatingModules, setIsCreatingModules] = useState(false);

  // Generation options state
  const [generateContent, setGenerateContent] = useState(true);
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [generationProgress, setGenerationProgress] = useState<{current: number; total: number} | null>(null);

  // Additional hooks for content generation
  const queryClient = useQueryClient();
  const generateModuleContent = useGenerateModuleContent();

  // Populate form when editing
  useEffect(() => {
    if (existingCourse && isEditing) {
      const { course } = existingCourse;
      setTitle(course.title);
      setDescription(course.description || '');
      setDifficulty(course.difficulty);
      setTags(course.tags);
      setAiEnabled(course.ai_enabled);
      if (course.instructions) {
        setInstructions(course.instructions);
      }
      // Populate module outlines from existing modules
      setModuleOutlines(
        existingCourse.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: '',
        }))
      );
    }
  }, [existingCourse, isEditing]);

  // Determine which steps to show based on AI enabled
  const visibleSteps = STEPS.filter((step) => !step.aiOnly || aiEnabled);
  const currentStepIndex = visibleSteps.findIndex((s) => s.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddObjective = () => {
    setInstructions({
      ...instructions,
      learning_objectives: [...instructions.learning_objectives, ''],
    });
  };

  const handleUpdateObjective = (index: number, value: string) => {
    const updated = [...instructions.learning_objectives];
    updated[index] = value;
    setInstructions({ ...instructions, learning_objectives: updated });
  };

  const handleRemoveObjective = (index: number) => {
    if (instructions.learning_objectives.length > 1) {
      const updated = instructions.learning_objectives.filter((_, i) => i !== index);
      setInstructions({ ...instructions, learning_objectives: updated });
    }
  };

  const handleMoveObjective = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= instructions.learning_objectives.length) return;

    const updated = [...instructions.learning_objectives];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setInstructions({ ...instructions, learning_objectives: updated });
  };

  const handleAddModule = () => {
    setModuleOutlines([
      ...moduleOutlines,
      {
        id: `new-${Date.now()}`,
        title: `Module ${moduleOutlines.length + 1}`,
        description: '',
      },
    ]);
  };

  const handleUpdateModule = (index: number, field: keyof ModuleOutline, value: string) => {
    const updated = [...moduleOutlines];
    updated[index] = { ...updated[index], [field]: value };
    setModuleOutlines(updated);
  };

  const handleRemoveModule = (index: number) => {
    setModuleOutlines(moduleOutlines.filter((_, i) => i !== index));
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= moduleOutlines.length) return;

    const updated = [...moduleOutlines];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setModuleOutlines(updated);
  };

  const handleSuggestModules = async () => {
    if (!isEditing || !courseId) {
      showError('Please save the course first before generating module suggestions');
      return;
    }

    try {
      const result = await suggestModules.mutateAsync({
        course_id: courseId,
      });

      // Store suggestions and open modal
      setAiSuggestions(result.suggestions);
      setSelectedSuggestions(new Set(result.suggestions.map((_, i) => i)));

      // If there are existing modules, we need to ask about mode
      // Otherwise, just go straight to selection
      if (existingModules && existingModules.length > 0) {
        setSuggestionMode(null); // Will prompt for mode choice
      } else {
        setSuggestionMode('add'); // No existing modules, just add
      }

      setShowSuggestionModal(true);
      success(`Generated ${result.suggestions.length} suggestions! Used ${result.tokens_used} tokens.`);
    } catch (err) {
      console.error('Failed to suggest modules:', err);
      showError('Failed to generate module suggestions. Please try again.');
    }
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(aiSuggestions.map((_, i) => i)));
  };

  const handleSelectNone = () => {
    setSelectedSuggestions(new Set());
  };

  const handleConfirmSuggestions = async () => {
    if (!courseId || selectedSuggestions.size === 0) return;

    setIsCreatingModules(true);

    try {
      // Delete existing modules if replacing
      if (suggestionMode === 'replace' && existingModules && existingModules.length > 0) {
        for (const module of existingModules) {
          await deleteModule.mutateAsync({ courseId, moduleId: module.id });
        }
      }

      const startIndex = suggestionMode === 'replace' ? 0 : (existingModules?.length || 0);

      // Get selected suggestions in order
      const selectedList = aiSuggestions.filter((_, idx) => selectedSuggestions.has(idx));

      if (generateContent) {
        // Generate and create modules one by one
        setGenerationProgress({ current: 0, total: selectedList.length });
        const createdModules: ModuleOutline[] = [];
        let stoppedDueToTokens = false;

        for (let i = 0; i < selectedList.length; i++) {
          const suggestion = selectedList[i];
          setGenerationProgress({ current: i + 1, total: selectedList.length });

          try {
            // Generate content for this module
            const generated = await generateModuleContent.mutateAsync({
              course_id: courseId,
              module_title: suggestion.title,
              module_prompt: `${suggestion.description}\n\nObjectives:\n${suggestion.objectives.map(o => `- ${o}`).join('\n')}`,
              generate_flashcards: true,
              flashcard_count: flashcardCount,
              generate_quiz: true,
              quiz_question_count: quizQuestionCount,
            });

            // Create module with generated content
            const moduleData: ModuleCreate = {
              title: suggestion.title,
              order_index: startIndex + i,
              content_markdown: generated.content_markdown,
              flashcards: generated.flashcards,
              quiz: generated.quiz || undefined,
            };

            const createdModule = await modulesApi.create(courseId, moduleData);
            createdModules.push({
              id: createdModule.id,
              title: createdModule.title,
              description: suggestion.description,
            });
          } catch (err: unknown) {
            console.error(`Failed to generate module ${suggestion.title}:`, err);

            // Check if it's an insufficient tokens error (402)
            // Use multiple detection methods for robustness
            let isTokenError = false;

            if (err instanceof ApiError) {
              isTokenError = err.status === 402;
            } else if (err && typeof err === 'object') {
              // Fallback: check for status property directly (in case instanceof doesn't work due to transpilation)
              const errObj = err as { status?: number; name?: string };
              isTokenError = errObj.status === 402 || errObj.name === 'ApiError' && 'status' in errObj && errObj.status === 402;
            }

            console.log('Error details:', {
              errorType: err?.constructor?.name,
              isApiError: err instanceof ApiError,
              hasStatus: err && typeof err === 'object' && 'status' in err,
              status: err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 'N/A',
              isTokenError
            });

            if (isTokenError) {
              stoppedDueToTokens = true;
              break; // Stop trying - all subsequent calls will also fail
            }
            // For other errors, continue with next module
          }
        }

        // Invalidate queries to refresh module list
        queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });

        // Update local module outlines with actually created modules
        console.log('Generation complete:', { createdCount: createdModules.length, stoppedDueToTokens, totalRequested: selectedList.length });

        if (createdModules.length > 0) {
          if (suggestionMode === 'replace') {
            setModuleOutlines(createdModules);
          } else {
            setModuleOutlines([...moduleOutlines, ...createdModules]);
          }

          if (stoppedDueToTokens) {
            success(`Created ${createdModules.length} of ${selectedList.length} modules with content (stopped due to insufficient tokens).`);
          } else {
            success(`Created ${createdModules.length} modules with content!`);
          }
          handleCloseSuggestionModal();
        } else if (stoppedDueToTokens) {
          // No modules created due to token shortage
          console.log('Showing token error toast');
          showError('Insufficient tokens. You need at least 25 tokens per module. Please add more tokens and try again.');
        } else {
          console.log('Showing general error toast');
          showError('Failed to create any modules. Please try again.');
        }

      } else {
        // Create empty modules via batch (existing logic)
        const modulesToCreate: ModuleCreate[] = selectedList.map((suggestion, i) => ({
          title: suggestion.title,
          order_index: startIndex + i,
          content_markdown: '',
          flashcards: [],
          quiz: undefined,
        }));

        const result = await batchCreateModules.mutateAsync({ courseId, modules: modulesToCreate });

        // Update local module outlines
        const newOutlines: ModuleOutline[] = result.created.map((m) => ({
          id: m.id,
          title: m.title,
          description: '',
        }));

        if (suggestionMode === 'replace') {
          setModuleOutlines(newOutlines);
        } else {
          setModuleOutlines([...moduleOutlines, ...newOutlines]);
        }

        success(`Created ${result.count} modules!`);
        handleCloseSuggestionModal();
      }

    } catch (err) {
      console.error('Failed to create modules:', err);
      showError('Failed to create modules. Please try again.');
    } finally {
      setIsCreatingModules(false);
      setGenerationProgress(null);
    }
  };

  const handleCloseSuggestionModal = () => {
    if (!isCreatingModules) {
      setShowSuggestionModal(false);
      setAiSuggestions([]);
      setSelectedSuggestions(new Set());
      setSuggestionMode(null);
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < visibleSteps.length) {
      setCurrentStep(visibleSteps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(visibleSteps[prevIndex].key);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!title.trim()) {
      showError('Please enter a course title');
      return;
    }

    try {
      if (isEditing && courseId) {
        // Update existing course
        const updateData: CourseUpdate = {
          title: title.trim(),
          description: description.trim() || undefined,
          difficulty,
          tags,
          ai_enabled: aiEnabled,
          instructions: aiEnabled ? {
            ...instructions,
            learning_objectives: instructions.learning_objectives.filter((o) => o.trim()),
            additional_context: instructions.additional_context || undefined,
          } : undefined,
        };
        await updateCourse.mutateAsync({ courseId, data: updateData });
        success('Course updated successfully');
        navigate(`/courses/${courseId}`);
      } else {
        // Create new course
        const createData: CourseCreate = {
          title: title.trim(),
          description: description.trim() || undefined,
          difficulty,
          tags,
          ai_enabled: aiEnabled,
          instructions: aiEnabled ? {
            ...instructions,
            learning_objectives: instructions.learning_objectives.filter((o) => o.trim()),
            additional_context: instructions.additional_context || undefined,
          } : undefined,
        };
        const newCourse = await createCourse.mutateAsync(createData);
        success('Course created successfully');
        navigate(`/courses/${newCourse.id}`);
      }
    } catch (err) {
      console.error('Failed to save course:', err);
      showError('Failed to save course. Please try again.');
    }
  };

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 'info':
        return title.trim().length > 0;
      case 'instructions':
        return (
          instructions.purpose.trim().length > 0 &&
          instructions.target_audience.trim().length > 0 &&
          instructions.tone.trim().length > 0
        );
      case 'modules':
        return true; // Modules are optional at creation
      default:
        return true;
    }
  };

  const canProceed = isStepValid(currentStep);
  const isSaving = createCourse.isPending || updateCourse.isPending;

  if (isEditing && loadingCourse) {
    return (
      <div className="space-y-6 page-enter">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Course' : 'Create Course'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Update your course details' : 'Build a new learning experience'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.key === currentStep;

            return (
              <li
                key={step.key}
                className={`relative ${index !== visibleSteps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      // Allow going back to completed steps
                      if (isCompleted || isCurrent) {
                        setCurrentStep(step.key);
                      }
                    }}
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                      isCompleted
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : isCurrent
                          ? 'border-2 border-indigo-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </button>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      isCurrent ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                    {step.aiOnly && (
                      <Sparkles className="w-3 h-3 inline ml-1 text-amber-500" />
                    )}
                  </span>
                </div>
                {index !== visibleSteps.length - 1 && (
                  <div
                    className={`absolute top-4 left-8 -ml-px w-full h-0.5 ${
                      isCompleted ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100% - 2rem)' }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'info' && (
            <div className="space-y-6">
              <Input
                id="title"
                label="Course Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Python for Data Engineers"
                required
              />

              <Textarea
                id="description"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will learners achieve with this course?"
                rows={3}
                showCharCount
                maxLength={500}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Course Type Selection */}
              <div className="border rounded-lg p-4 space-y-4">
                <p className="font-medium text-gray-900">Course Type</p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="courseType"
                      checked={!aiEnabled}
                      onChange={() => setAiEnabled(false)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">Manual Course</p>
                      <p className="text-sm text-gray-500">
                        Write all content yourself. Full control over every module.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="courseType"
                      checked={aiEnabled}
                      onChange={() => setAiEnabled(true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">AI-Assisted Course</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Generate modules, flashcards, and quizzes with AI. You can still edit
                        everything.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Instructions */}
          {currentStep === 'instructions' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">AI Instructions</p>
                    <p className="text-sm text-amber-700 mt-1">
                      These instructions guide AI generation for all modules. Think of this like a
                      Claude project system prompt.
                    </p>
                  </div>
                </div>
              </div>

              <Textarea
                id="purpose"
                label="Purpose"
                value={instructions.purpose}
                onChange={(e) => setInstructions({ ...instructions, purpose: e.target.value })}
                placeholder="e.g., Prepare for FAANG coding interviews focusing on data structures and algorithms"
                rows={3}
                required
              />

              <Textarea
                id="target_audience"
                label="Target Audience"
                value={instructions.target_audience}
                onChange={(e) =>
                  setInstructions({ ...instructions, target_audience: e.target.value })
                }
                placeholder="e.g., Senior engineers with 5+ years experience looking to transition to big tech"
                rows={2}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives
                </label>
                <div className="space-y-2">
                  {instructions.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => handleMoveObjective(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveObjective(index, 'down')}
                          disabled={index === instructions.learning_objectives.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-gray-400 text-sm w-6 text-center">{index + 1}</span>
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleUpdateObjective(index, e.target.value)}
                        placeholder={`Objective ${index + 1}`}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {instructions.learning_objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleRemoveObjective(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={handleAddObjective}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Objective
                  </Button>
                </div>
              </div>

              <Textarea
                id="tone"
                label="Tone & Style"
                value={instructions.tone}
                onChange={(e) => setInstructions({ ...instructions, tone: e.target.value })}
                placeholder="e.g., Technical but approachable, visual-first approach with diagrams and examples"
                rows={2}
                required
              />

              <Textarea
                id="additional_context"
                label="Additional Context (optional)"
                value={instructions.additional_context || ''}
                onChange={(e) =>
                  setInstructions({
                    ...instructions,
                    additional_context: e.target.value || undefined,
                  })
                }
                placeholder="Any other guidance for the AI when generating content..."
                rows={3}
              />
            </div>
          )}

          {/* Step 3: Modules */}
          {currentStep === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Module Outline</h3>
                  <p className="text-sm text-gray-500">
                    Define the structure of your course. You can add content to each module after
                    creating the course.
                  </p>
                </div>
                <Button onClick={handleAddModule}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Module
                </Button>
              </div>

              {moduleOutlines.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No modules yet</p>
                  <Button variant="secondary" className="mt-4" onClick={handleAddModule}>
                    Add First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {moduleOutlines.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-white"
                    >
                      <div className="flex flex-col gap-1 text-gray-400">
                        <button
                          onClick={() => handleMoveModule(index, 'up')}
                          disabled={index === 0}
                          className="hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4 rotate-90" />
                        </button>
                        <GripVertical className="w-4 h-4" />
                        <button
                          onClick={() => handleMoveModule(index, 'down')}
                          disabled={index === moduleOutlines.length - 1}
                          className="hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </button>
                      </div>
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => handleUpdateModule(index, 'title', e.target.value)}
                          placeholder="Module title"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={module.description}
                          onChange={(e) => handleUpdateModule(index, 'description', e.target.value)}
                          placeholder="Brief description (optional)"
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveModule(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {aiEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">AI Module Suggestions</p>
                      <p className="text-sm text-amber-700 mt-1">
                        {isEditing
                          ? 'Generate a suggested module structure based on your course instructions.'
                          : 'After creating the course, you\'ll be able to generate module suggestions based on your AI instructions.'}
                      </p>
                      {isEditing && (
                        <Button
                          variant="secondary"
                          className="mt-3"
                          onClick={handleSuggestModules}
                          isLoading={suggestModules.isPending}
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate Suggestions
                        </Button>
                      )}
                      <p className="text-xs text-amber-600 mt-2">
                        Cost: ~10 tokens
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={handleBack} disabled={isFirstStep}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex gap-2">
          {!isLastStep ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} isLoading={isSaving} disabled={!canProceed}>
              {isEditing ? 'Save Changes' : 'Create Course'}
            </Button>
          )}
        </div>
      </div>

      {/* AI Suggestion Modal */}
      <Modal
        isOpen={showSuggestionModal}
        onClose={handleCloseSuggestionModal}
        title="AI Module Suggestions"
        size="lg"
      >
        <div className="space-y-4">
          {/* Mode selection - only show if modules exist and mode not chosen */}
          {existingModules && existingModules.length > 0 && suggestionMode === null && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You have {existingModules.length} existing module{existingModules.length !== 1 ? 's' : ''}.
                What would you like to do with the AI suggestions?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSuggestionMode('add')}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Existing
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSuggestionMode('replace')}
                  className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Replace All
                </Button>
              </div>
            </div>
          )}

          {/* Suggestion selection - show after mode is chosen */}
          {suggestionMode !== null && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Select which modules to create:
                </p>
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleSelectNone}
                    className="text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Select None
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {aiSuggestions.map((suggestion, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSuggestions.has(index)
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSuggestions.has(index)}
                      onChange={() => handleToggleSuggestion(index)}
                      className="mt-1 h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{suggestion.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{suggestion.description}</p>
                      {suggestion.objectives.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {suggestion.objectives.slice(0, 2).join(' • ')}
                          {suggestion.objectives.length > 2 && ` • +${suggestion.objectives.length - 2} more`}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Generation Options */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={generateContent}
                      onChange={(e) => setGenerateContent(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Generate content for modules
                    </span>
                  </label>
                  <span className="text-xs text-gray-500">
                    ~{selectedSuggestions.size * 25} tokens
                  </span>
                </div>

                {generateContent && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Flashcards per module
                      </label>
                      <input
                        type="number"
                        value={flashcardCount}
                        onChange={(e) => setFlashcardCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 15)))}
                        min={1}
                        max={50}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Quiz questions per module
                      </label>
                      <input
                        type="number"
                        value={quizQuestionCount}
                        onChange={(e) => setQuizQuestionCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 10)))}
                        min={1}
                        max={30}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                <p className="text-sm text-gray-600">
                  {selectedSuggestions.size} of {aiSuggestions.length} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleCloseSuggestionModal}
                    disabled={isCreatingModules}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSuggestions}
                    disabled={selectedSuggestions.size === 0 || isCreatingModules}
                  >
                    {isCreatingModules ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        {generationProgress
                          ? `Generating ${generationProgress.current}/${generationProgress.total}...`
                          : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Create {selectedSuggestions.size} Module{selectedSuggestions.size !== 1 ? 's' : ''}
                        {generateContent && ` (~${selectedSuggestions.size * 25} tokens)`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
