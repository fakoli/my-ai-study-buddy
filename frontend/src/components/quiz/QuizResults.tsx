import { CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../common/Card';
import { Button } from '../common/Button';
import type { QuizSubmission, Quiz } from '../../types';

interface QuizResultsProps {
  quiz: Quiz;
  submission: QuizSubmission;
  onRetry: () => void;
  onBack: () => void;
}

export function QuizResults({ quiz, submission, onRetry, onBack }: QuizResultsProps) {
  const correctCount = submission.results.filter((r) => r.is_correct).length;
  const totalQuestions = quiz.questions.length;
  const percentage = submission.score;

  const getScoreMessage = () => {
    if (percentage >= 90) return { text: "Excellent!", emoji: "🎉" };
    if (percentage >= 70) return { text: "Great job!", emoji: "👍" };
    if (percentage >= 50) return { text: "Good effort!", emoji: "💪" };
    return { text: "Keep practicing!", emoji: "📚" };
  };

  const message = getScoreMessage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-900">Quiz Complete!</h2>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">{message.emoji}</div>
          <p className="text-xl font-medium text-gray-900">{message.text}</p>
          <div className="text-4xl font-bold text-indigo-600">
            {Math.round(percentage)}%
          </div>
          <p className="text-gray-500">
            You got {correctCount} out of {totalQuestions} questions correct
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button variant="secondary" onClick={onBack}>
              Back to Decks
            </Button>
            <Button onClick={onRetry}>Try Again</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Review Answers</h3>
        {quiz.questions.map((question, index) => {
          const result = submission.results[index];
          const isCorrect = result.is_correct;

          return (
            <Card key={question.id} variant="bordered">
              <CardContent>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.question}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-600">
                        Your answer:{' '}
                        <span
                          className={
                            isCorrect ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {question.options[result.selected]}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-green-600">
                          Correct answer: {question.options[result.correct]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
