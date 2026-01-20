import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  FileText,
  HelpCircle,
  BookOpen,
  Bold,
  Italic,
  Code,
  List,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { useCourse } from '../hooks/useCourses';
import { useModule, useCreateModule, useUpdateModule } from '../hooks/useModules';
import {
  useGenerateModuleContent,
  useGenerateFlashcards,
  useGenerateQuiz,
  useGenerateVisual,
} from '../hooks/useGeneration';
import { useToast } from '../hooks/useToast';
import type {
  FlashcardData,
  QuizQuestionData,
  ModuleCreate,
  ModuleUpdate,
  VisualStyle,
  VisualModel,
  VisualAspect,
} from '../types';

type EditorTab = 'content' | 'flashcards' | 'quiz';

export function ModuleEditor() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const isEditing = moduleId !== 'new' && !!moduleId;

  // Fetch data
  const { data: courseData, isLoading: loadingCourse } = useCourse(courseId || '');
  const { data: existingModule, isLoading: loadingModule } = useModule(
    courseId || '',
    isEditing ? moduleId || '' : ''
  );
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  // AI Generation hooks
  const generateContent = useGenerateModuleContent();
  const generateFlashcards = useGenerateFlashcards();
  const generateQuiz = useGenerateQuiz();
  const generateVisual = useGenerateVisual();

  // AI prompt state
  const [modulePrompt, setModulePrompt] = useState('');
  const [flashcardCount, setFlashcardCount] = useState(15);
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);

  // Editor state
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (existingModule && isEditing) {
      setTitle(existingModule.title);
      setContentMarkdown(existingModule.content_markdown || '');
      setFlashcards(existingModule.flashcards || []);
      setQuizQuestions(existingModule.quiz?.questions || []);
    }
  }, [existingModule, isEditing]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, contentMarkdown, flashcards, quizQuestions]);

  const isAiEnabled = courseData?.course.ai_enabled;

  // Markdown toolbar handlers
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentMarkdown.substring(start, end);
    const newText =
      contentMarkdown.substring(0, start) + before + selectedText + after + contentMarkdown.substring(end);
    setContentMarkdown(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // Flashcard handlers
  const handleAddFlashcard = () => {
    setFlashcards([...flashcards, { front: '', back: '', visual: null }]);
  };

  const handleUpdateFlashcard = (index: number, field: keyof FlashcardData, value: string | null) => {
    const updated = [...flashcards];
    updated[index] = { ...updated[index], [field]: value };
    setFlashcards(updated);
  };

  const handleRemoveFlashcard = (index: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const handleMoveFlashcard = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= flashcards.length) return;

    const updated = [...flashcards];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFlashcards(updated);
  };

  // Quiz handlers
  const handleAddQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question: '',
        options: ['', '', '', ''],
        correct_index: 0,
        explanation: null,
      },
    ]);
  };

  const handleUpdateQuestion = (
    index: number,
    field: keyof QuizQuestionData,
    value: string | number | string[] | null
  ) => {
    const updated = [...quizQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setQuizQuestions(updated);
  };

  const handleUpdateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...quizQuestions];
    const newOptions = [...updated[questionIndex].options];
    newOptions[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
    setQuizQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  // AI Generation handlers
  const handleGenerateContent = async () => {
    if (!courseId || !title.trim()) {
      showError('Please enter a module title first');
      return;
    }
    if (!modulePrompt.trim() || modulePrompt.trim().length < 10) {
      showError('Please enter a module prompt (at least 10 characters)');
      return;
    }

    try {
      const result = await generateContent.mutateAsync({
        course_id: courseId,
        module_title: title.trim(),
        module_prompt: modulePrompt.trim(),
        generate_flashcards: true,
        flashcard_count: flashcardCount,
        generate_quiz: true,
        quiz_question_count: quizQuestionCount,
      });

      // Apply generated content
      setContentMarkdown(result.content_markdown);
      if (result.flashcards.length > 0) {
        setFlashcards(result.flashcards);
      }
      if (result.quiz && result.quiz.questions.length > 0) {
        setQuizQuestions(result.quiz.questions);
      }

      success(`Content generated! Used ${result.tokens_used} tokens.`);
    } catch (err) {
      console.error('Failed to generate content:', err);
      showError('Failed to generate content. Please try again.');
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!courseId || !moduleId || moduleId === 'new') {
      showError('Please save the module first before generating flashcards');
      return;
    }

    try {
      const result = await generateFlashcards.mutateAsync({
        course_id: courseId,
        module_id: moduleId,
        count: flashcardCount,
      });

      // Append or replace flashcards
      if (flashcards.length > 0) {
        // Ask if should replace or append
        const shouldReplace = window.confirm(
          'Replace existing flashcards? Click Cancel to append instead.'
        );
        if (shouldReplace) {
          setFlashcards(result.flashcards);
        } else {
          setFlashcards([...flashcards, ...result.flashcards]);
        }
      } else {
        setFlashcards(result.flashcards);
      }

      success(`Generated ${result.flashcards.length} flashcards! Used ${result.tokens_used} tokens.`);
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
      showError('Failed to generate flashcards. Please try again.');
    }
  };

  const handleGenerateQuiz = async () => {
    if (!courseId || !moduleId || moduleId === 'new') {
      showError('Please save the module first before generating a quiz');
      return;
    }

    try {
      const result = await generateQuiz.mutateAsync({
        course_id: courseId,
        module_id: moduleId,
        question_count: quizQuestionCount,
      });

      // Replace quiz questions
      setQuizQuestions(result.quiz.questions);
      success(`Generated ${result.quiz.questions.length} questions! Used ${result.tokens_used} tokens.`);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      showError('Failed to generate quiz. Please try again.');
    }
  };

  const handleGenerateVisual = async (description: string) => {
    if (!courseId || !moduleId || moduleId === 'new') {
      showError('Please save the module first before generating visuals');
      return;
    }

    try {
      const result = await generateVisual.mutateAsync({
        course_id: courseId,
        module_id: moduleId,
        description,
        style: 'educational_diagram',
        model: 'flash',
        aspect: 'landscape',
      });

      // Insert markdown reference at cursor position
      const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const newText =
          contentMarkdown.substring(0, start) +
          '\n' + result.markdown_reference + '\n' +
          contentMarkdown.substring(start);
        setContentMarkdown(newText);
      } else {
        // Append to end
        setContentMarkdown(contentMarkdown + '\n' + result.markdown_reference + '\n');
      }

      success(`Visual generated! Used ${result.tokens_used} tokens.`);
    } catch (err) {
      console.error('Failed to generate visual:', err);
      showError('Failed to generate visual. Please try again.');
    }
  };

  const isGenerating = generateContent.isPending || generateFlashcards.isPending || generateQuiz.isPending || generateVisual.isPending;

  // Save handler
  const handleSave = async () => {
    if (!courseId) return;
    if (!title.trim()) {
      showError('Please enter a module title');
      return;
    }

    try {
      const moduleData = {
        title: title.trim(),
        content_markdown: contentMarkdown,
        flashcards: flashcards.filter((f) => f.front.trim() && f.back.trim()),
        quiz:
          quizQuestions.length > 0
            ? {
                questions: quizQuestions.filter(
                  (q) => q.question.trim() && q.options.some((o) => o.trim())
                ),
              }
            : null,
      };

      if (isEditing && moduleId) {
        await updateModule.mutateAsync({
          courseId,
          moduleId,
          data: moduleData as ModuleUpdate,
        });
        success('Module updated successfully');
      } else {
        const newModule = await createModule.mutateAsync({
          courseId,
          data: moduleData as ModuleCreate,
        });
        success('Module created successfully');
        navigate(`/courses/${courseId}/modules/${newModule.id}`, { replace: true });
        return;
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save module:', err);
      showError('Failed to save module. Please try again.');
    }
  };

  const isSaving = createModule.isPending || updateModule.isPending;
  const isLoading = loadingCourse || (isEditing && loadingModule);

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500">{courseData.course.title}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Module' : 'New Module'}
              {isAiEnabled && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </h1>
          </div>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Module Title */}
      <Input
        id="module-title"
        label="Module Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Introduction to Variables"
        required
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'content'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Content
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'flashcards'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Flashcards ({flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'quiz'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quiz ({quizQuestions.length})
          </button>
        </nav>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {/* AI Prompt (for AI-enabled courses) */}
          {isAiEnabled && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Module Prompt</p>
                    <p className="text-sm text-amber-700 mt-1 mb-3">
                      Describe what this module should cover. AI will use the course instructions to
                      generate content, flashcards, and quiz questions.
                    </p>
                    <div className="space-y-3">
                      <textarea
                        value={modulePrompt}
                        onChange={(e) => setModulePrompt(e.target.value)}
                        placeholder="e.g., Cover DataFrame basics, Series, indexing, and common operations like filtering, groupby, and merging. Include visual diagrams of DataFrame structure."
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        rows={3}
                      />
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-amber-700">Flashcards:</label>
                          <select
                            value={flashcardCount}
                            onChange={(e) => setFlashcardCount(Number(e.target.value))}
                            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-amber-700">Quiz questions:</label>
                          <select
                            value={quizQuestionCount}
                            onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                          </select>
                        </div>
                        <Button
                          onClick={handleGenerateContent}
                          isLoading={generateContent.isPending}
                          disabled={isGenerating || !title.trim() || modulePrompt.trim().length < 10}
                          className="ml-auto"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate All
                        </Button>
                      </div>
                      <p className="text-xs text-amber-600">
                        Cost: ~25 tokens. This will generate content, flashcards, and quiz.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Markdown Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-t-lg border border-b-0 border-gray-300">
            <button
              onClick={() => insertMarkdown('# ')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('## ')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('### ')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </button>
            <div className="w-px bg-gray-300 mx-1" />
            <button
              onClick={() => insertMarkdown('- ')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Link"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('![alt](', ')')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Image"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown('\n```\n', '\n```\n')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Code Block"
            >
              <span className="text-xs font-mono">{'{}'}</span>
            </button>
          </div>

          {/* Split Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-300 rounded-b-lg overflow-hidden">
            {/* Editor */}
            <div className="border-r border-gray-300">
              <textarea
                id="markdown-editor"
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Write your module content in Markdown..."
                className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none"
              />
            </div>
            {/* Preview */}
            <div className="bg-gray-50 h-96 overflow-auto p-4 prose prose-indigo max-w-none">
              {contentMarkdown ? (
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {contentMarkdown}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">Preview will appear here...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Create flashcards to help learners memorize key concepts.
            </p>
            <div className="flex gap-2">
              {isAiEnabled && isEditing && (
                <Button
                  variant="secondary"
                  onClick={handleGenerateFlashcards}
                  isLoading={generateFlashcards.isPending}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate with AI
                </Button>
              )}
              <Button onClick={handleAddFlashcard}>
                <Plus className="w-4 h-4 mr-1" />
                Add Flashcard
              </Button>
            </div>
          </div>

          {flashcards.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No flashcards yet</p>
              <Button variant="secondary" className="mt-4" onClick={handleAddFlashcard}>
                Add First Flashcard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flashcards.map((card, index) => (
                <Card key={index}>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 text-gray-400 pt-2">
                        <button
                          onClick={() => handleMoveFlashcard(index, 'up')}
                          disabled={index === 0}
                          className="hover:text-gray-600 disabled:opacity-30"
                        >
                          <GripVertical className="w-4 h-4 rotate-90" />
                        </button>
                        <span className="text-xs font-medium text-center">{index + 1}</span>
                        <button
                          onClick={() => handleMoveFlashcard(index, 'down')}
                          disabled={index === flashcards.length - 1}
                          className="hover:text-gray-600 disabled:opacity-30"
                        >
                          <GripVertical className="w-4 h-4 -rotate-90" />
                        </button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Textarea
                          label="Front (Question)"
                          value={card.front}
                          onChange={(e) => handleUpdateFlashcard(index, 'front', e.target.value)}
                          placeholder="What is the question?"
                          rows={3}
                        />
                        <Textarea
                          label="Back (Answer)"
                          value={card.back}
                          onChange={(e) => handleUpdateFlashcard(index, 'back', e.target.value)}
                          placeholder="What is the answer?"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveFlashcard(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Create quiz questions to test learner comprehension.
            </p>
            <div className="flex gap-2">
              {isAiEnabled && isEditing && (
                <Button
                  variant="secondary"
                  onClick={handleGenerateQuiz}
                  isLoading={generateQuiz.isPending}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate with AI
                </Button>
              )}
              <Button onClick={handleAddQuestion}>
                <Plus className="w-4 h-4 mr-1" />
                Add Question
              </Button>
            </div>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No quiz questions yet</p>
              <Button variant="secondary" className="mt-4" onClick={handleAddQuestion}>
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quizQuestions.map((question, qIndex) => (
                <Card key={qIndex}>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          Question {qIndex + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Textarea
                        label="Question"
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        rows={2}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Answer Options
                        </label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correct_index === oIndex}
                              onChange={() => handleUpdateQuestion(qIndex, 'correct_index', oIndex)}
                              className="text-indigo-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                handleUpdateQuestionOption(qIndex, oIndex, e.target.value)
                              }
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-gray-500">
                          Select the radio button next to the correct answer
                        </p>
                      </div>

                      <Textarea
                        label="Explanation (optional)"
                        value={question.explanation || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(
                            qIndex,
                            'explanation',
                            e.target.value || null
                          )
                        }
                        placeholder="Explain why this answer is correct..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm">
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
