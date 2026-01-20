import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  Edit,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useModule, useModules } from '../hooks/useModules';
import { useCourse } from '../hooks/useCourses';

type ViewTab = 'content' | 'flashcards' | 'quiz';

export function ModuleViewer() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ViewTab>('content');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const { data: courseData } = useCourse(courseId || '');
  const { data: module, isLoading, error } = useModule(courseId || '', moduleId || '');
  const { data: modules } = useModules(courseId || '');

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Module not found</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const isEditable = courseData?.course.source === 'database';
  const currentModuleIndex = modules?.findIndex((m) => m.id === moduleId) ?? -1;
  const prevModule = currentModuleIndex > 0 ? modules?.[currentModuleIndex - 1] : null;
  const nextModule = modules && currentModuleIndex < modules.length - 1
    ? modules[currentModuleIndex + 1]
    : null;

  const handleFlashcardNav = (direction: 'prev' | 'next') => {
    setIsFlipped(false);
    if (direction === 'prev' && currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1);
    } else if (direction === 'next' && currentFlashcardIndex < module.flashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!quizSubmitted) {
      setQuizAnswers({ ...quizAnswers, [questionIndex]: answerIndex });
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const calculateQuizScore = () => {
    if (!module.quiz) return 0;
    let correct = 0;
    module.quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_index) correct++;
    });
    return Math.round((correct / module.quiz.questions.length) * 100);
  };

  const currentFlashcard = module.flashcards[currentFlashcardIndex];

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
            <p className="text-sm text-gray-500">{courseData?.course.title}</p>
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
          </div>
        </div>
        {isEditable && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

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
          {module.flashcards.length > 0 && (
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'flashcards'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Flashcards ({module.flashcards.length})
            </button>
          )}
          {module.quiz && module.quiz.questions.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'quiz'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Quiz ({module.quiz.questions.length})
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'content' && (
        <Card>
          <CardContent className="prose prose-indigo max-w-none">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
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
              {module.content_markdown || '*No content yet*'}
            </ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Flashcards */}
      {activeTab === 'flashcards' && module.flashcards.length > 0 && (
        <div className="flex flex-col items-center space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-2xl h-64 cursor-pointer"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <Card
                className="absolute w-full h-full flex items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg text-center">{currentFlashcard?.front}</p>
              </Card>
              {/* Back */}
              <Card
                className="absolute w-full h-full flex items-center justify-center p-8 bg-indigo-50"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-lg text-center">{currentFlashcard?.back}</p>
              </Card>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => handleFlashcardNav('prev')}
              disabled={currentFlashcardIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-500">
              {currentFlashcardIndex + 1} / {module.flashcards.length}
            </span>
            <Button
              variant="secondary"
              onClick={() => handleFlashcardNav('next')}
              disabled={currentFlashcardIndex === module.flashcards.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-500">Click the card to flip</p>
        </div>
      )}

      {/* Quiz */}
      {activeTab === 'quiz' && module.quiz && (
        <div className="space-y-6">
          {quizSubmitted && (
            <Card className="bg-indigo-50">
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">
                    Score: {calculateQuizScore()}%
                  </p>
                  <p className="text-gray-600 mt-1">
                    {quizSubmitted && calculateQuizScore() >= 70
                      ? 'Great job!'
                      : 'Keep practicing!'}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                  >
                    Retry Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {module.quiz.questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardContent>
                <p className="font-medium mb-4">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => {
                    const isSelected = quizAnswers[qIndex] === oIndex;
                    const isCorrect = question.correct_index === oIndex;
                    let optionClass = 'border-gray-200 hover:border-indigo-300';

                    if (quizSubmitted) {
                      if (isCorrect) {
                        optionClass = 'border-green-500 bg-green-50';
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-red-500 bg-red-50';
                      }
                    } else if (isSelected) {
                      optionClass = 'border-indigo-500 bg-indigo-50';
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleQuizAnswer(qIndex, oIndex)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${optionClass}`}
                        disabled={quizSubmitted}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && question.explanation && (
                  <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {!quizSubmitted && (
            <Button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length !== module.quiz.questions.length}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        {prevModule ? (
          <Button
            variant="secondary"
            onClick={() => navigate(`/courses/${courseId}/modules/${prevModule.id}`)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {prevModule.title}
          </Button>
        ) : (
          <div />
        )}
        {nextModule ? (
          <Button
            onClick={() => navigate(`/courses/${courseId}/modules/${nextModule.id}`)}
          >
            {nextModule.title}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            Finish
          </Button>
        )}
      </div>
    </div>
  );
}
