import { useState } from 'react';
import clsx from 'clsx';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { CardWithDeck, Difficulty } from '../../types';

interface FlashCardProps {
  card: CardWithDeck;
  onDifficulty: (difficulty: Difficulty) => void;
  isSubmitting?: boolean;
}

export function FlashCard({ card, onDifficulty, isSubmitting }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDifficulty = (difficulty: Difficulty) => {
    onDifficulty(difficulty);
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-2 text-sm text-gray-500 text-center">
        {card.deck_title}
      </div>

      <Card
        className={clsx(
          'min-h-[300px] cursor-pointer transition-all duration-300 transform',
          isFlipped && 'bg-indigo-50'
        )}
        onClick={handleFlip}
      >
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
          {!isFlipped ? (
            <div className="text-center">
              <p className="text-xl font-medium text-gray-900">{card.front}</p>
              <p className="mt-4 text-sm text-gray-500">Click to reveal answer</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-xl font-medium text-gray-900">{card.back}</p>
              {card.visual_url && (
                <img
                  src={card.visual_url}
                  alt="Visual aid"
                  className="max-w-full h-auto rounded-lg"
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {isFlipped && (
        <div className="mt-4 space-y-2">
          <p className="text-center text-sm text-gray-600 mb-2">
            How difficult was this?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              onClick={() => handleDifficulty('easy')}
              disabled={isSubmitting}
              className="bg-green-100 hover:bg-green-200 text-green-700"
            >
              Easy
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDifficulty('medium')}
              disabled={isSubmitting}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
            >
              Medium
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDifficulty('hard')}
              disabled={isSubmitting}
              className="bg-red-100 hover:bg-red-200 text-red-700"
            >
              Hard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
