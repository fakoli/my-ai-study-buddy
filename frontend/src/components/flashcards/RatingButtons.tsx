import { ThumbsUp, ThumbsDown, Meh, Skull } from 'lucide-react';
import type { FlashcardRating } from '../../types';

interface RatingButtonsProps {
  onRate: (rating: FlashcardRating) => void;
  currentRating?: FlashcardRating;
  isLoading?: boolean;
}

const ratingConfig: Record<
  FlashcardRating,
  { label: string; icon: typeof ThumbsUp; color: string; selectedBg: string }
> = {
  easy: {
    label: 'Easy',
    icon: ThumbsUp,
    color: 'text-green-600 hover:text-green-700',
    selectedBg: 'bg-green-100 border-green-500',
  },
  medium: {
    label: 'Medium',
    icon: Meh,
    color: 'text-yellow-600 hover:text-yellow-700',
    selectedBg: 'bg-yellow-100 border-yellow-500',
  },
  hard: {
    label: 'Hard',
    icon: ThumbsDown,
    color: 'text-red-600 hover:text-red-700',
    selectedBg: 'bg-red-100 border-red-500',
  },
  unhelpful: {
    label: 'Unhelpful',
    icon: Skull,
    color: 'text-gray-600 hover:text-gray-700',
    selectedBg: 'bg-gray-100 border-gray-500',
  },
};

export function RatingButtons({ onRate, currentRating, isLoading }: RatingButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 text-center">How was this card?</p>
      <div className="flex justify-center gap-2">
        {(Object.keys(ratingConfig) as FlashcardRating[]).map((rating) => {
          const config = ratingConfig[rating];
          const Icon = config.icon;
          const isSelected = currentRating === rating;

          return (
            <button
              key={rating}
              onClick={() => onRate(rating)}
              disabled={isLoading}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all
                ${
                  isSelected
                    ? config.selectedBg
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={config.label}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
              <span className="text-xs font-medium text-gray-700">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
