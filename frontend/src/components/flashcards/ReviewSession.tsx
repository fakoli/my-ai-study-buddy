import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { FlashCard } from './FlashCard';
import { Button } from '../common/Button';
import { Card, CardContent } from '../common/Card';
import { useDueCards, useSubmitReview } from '../../hooks/useReviews';
import type { Difficulty } from '../../types';

export function ReviewSession() {
  const { data, isLoading, refetch } = useDueCards(20);
  const submitReview = useSubmitReview();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const cards = data?.cards ?? [];

  if (cards.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            All caught up!
          </h3>
          <p className="text-gray-500">
            No cards are due for review right now. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = cards[currentIndex];

  if (!currentCard || currentIndex >= cards.length) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Complete!
          </h3>
          <p className="text-gray-500 mb-4">
            You reviewed {completed} cards in this session.
          </p>
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setCompleted(0);
              refetch();
            }}
          >
            Start New Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDifficulty = async (difficulty: Difficulty) => {
    try {
      await submitReview.mutateAsync({
        card_id: currentCard.id,
        difficulty,
      });
      setCompleted((prev) => prev + 1);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="text-sm text-gray-500">
          {completed} reviewed
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      <FlashCard
        card={currentCard}
        onDifficulty={handleDifficulty}
        isSubmitting={submitReview.isPending}
      />
    </div>
  );
}
