import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Textarea } from '../common/Textarea';
import { Card, CardContent } from '../common/Card';
import type { FlashcardData } from '../../types';

export interface FlashcardItemProps {
  card: FlashcardData;
  index: number;
  totalCount: number;
  onUpdate: (field: keyof FlashcardData, value: string | undefined) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

export function FlashcardItem({
  card,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMove,
}: FlashcardItemProps) {
  // Alternate background colors for zebra striping
  const isEven = index % 2 === 0;

  return (
    <Card className={isEven ? 'bg-white' : 'bg-gray-50/70'}>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Number badge and move controls */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
              type="button"
              aria-label={`Move flashcard ${index + 1} up`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
              {index + 1}
            </div>
            <button
              onClick={() => onMove('down')}
              disabled={index === totalCount - 1}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
              type="button"
              aria-label={`Move flashcard ${index + 1} down`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Card content */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Front (Question)"
              value={card.front}
              onChange={(e) => onUpdate('front', e.target.value)}
              placeholder="What is the question?"
              rows={3}
            />
            <Textarea
              label="Back (Answer)"
              value={card.back}
              onChange={(e) => onUpdate('back', e.target.value)}
              placeholder="What is the answer?"
              rows={3}
            />
          </div>

          {/* Delete button */}
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            type="button"
            aria-label={`Remove flashcard ${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
