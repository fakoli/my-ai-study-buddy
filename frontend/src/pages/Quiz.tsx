import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { QuizQuestion } from '../components/quiz/QuizQuestion';
import { QuizResults } from '../components/quiz/QuizResults';
import { useQuizSession } from '../hooks/useQuiz';

export function Quiz() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const {
    quiz,
    currentQuestion,
    currentIndex,
    answers,
    isComplete,
    isGenerating,
    isSubmitting,
    submission,
    startQuiz,
    submitAnswer,
    submitQuiz,
    reset,
  } = useQuizSession(deckId);

  const handleStart = async () => {
    try {
      await startQuiz(5);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    if (quiz) {
      try {
        await submitQuiz(quiz.id);
      } catch (error) {
        console.error('Failed to submit quiz:', error);
      }
    }
  };

  if (!quiz) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
            <p className="text-gray-500">Test your knowledge</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to start?
            </h3>
            <p className="text-gray-500 mb-4">
              You'll answer 5 questions based on your flashcards
            </p>
            <Button onClick={handleStart} isLoading={isGenerating}>
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
        </div>

        <QuizResults
          quiz={quiz}
          submission={submission}
          onRetry={() => {
            reset();
            handleStart();
          }}
          onBack={() => navigate('/decks')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Quiz</h1>
          <p className="text-gray-500">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {isComplete ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All questions answered!
            </h3>
            <p className="text-gray-500 mb-4">
              Ready to see your results?
            </p>
            <Button onClick={handleSubmitQuiz} isLoading={isSubmitting}>
              Submit Quiz
            </Button>
          </CardContent>
        </Card>
      ) : currentQuestion ? (
        <QuizQuestion
          question={currentQuestion}
          selectedAnswer={answers[currentIndex]}
          onSelectAnswer={submitAnswer}
        />
      ) : null}
    </div>
  );
}
