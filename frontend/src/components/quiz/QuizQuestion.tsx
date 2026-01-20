import clsx from 'clsx';
import { Card, CardContent } from '../common/Card';
import type { QuizQuestion as QuizQuestionType } from '../../types';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedAnswer?: number;
  onSelectAnswer: (index: number) => void;
  showResult?: boolean;
  disabled?: boolean;
}

export function QuizQuestion({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  disabled,
}: QuizQuestionProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = question.correct_index === index;

            return (
              <button
                key={index}
                onClick={() => onSelectAnswer(index)}
                disabled={disabled || showResult}
                className={clsx(
                  'w-full p-4 text-left rounded-lg border-2 transition-all',
                  {
                    'border-gray-200 hover:border-indigo-300':
                      !isSelected && !showResult,
                    'border-indigo-500 bg-indigo-50': isSelected && !showResult,
                    'border-green-500 bg-green-50': showResult && isCorrect,
                    'border-red-500 bg-red-50':
                      showResult && isSelected && !isCorrect,
                    'cursor-not-allowed opacity-50': disabled,
                  }
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium',
                      {
                        'bg-gray-200 text-gray-600': !isSelected && !showResult,
                        'bg-indigo-500 text-white': isSelected && !showResult,
                        'bg-green-500 text-white': showResult && isCorrect,
                        'bg-red-500 text-white':
                          showResult && isSelected && !isCorrect,
                      }
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showResult && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Explanation:</span>{' '}
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
