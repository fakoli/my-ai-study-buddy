import { Plus, FileText, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { FlashcardItem } from './FlashcardItem';
import type { FlashcardData } from '../../types';

export interface FlashcardsTabProps {
  flashcards: FlashcardData[];
  isAiEnabled: boolean;
  isEditing: boolean;
  isGenerating: boolean;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof FlashcardData, value: string | undefined) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onGenerate: () => void;
}

export function FlashcardsTab({
  flashcards,
  isAiEnabled,
  isEditing,
  isGenerating,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onGenerate,
}: FlashcardsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Create flashcards to help learners memorize key concepts.
        </p>
        <div className="flex gap-2">
          {isAiEnabled && isEditing && (
            <Button
              variant="secondary"
              onClick={onGenerate}
              isLoading={isGenerating}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Generate with AI
            </Button>
          )}
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add Flashcard
          </Button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
          <div className="w-14 h-14 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
            <FileText className="w-7 h-7 text-indigo-500" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No flashcards yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create flashcards to help learners memorize key concepts</p>
          <Button variant="secondary" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1" />
            Add First Flashcard
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {flashcards.map((card, index) => (
            <FlashcardItem
              key={index}
              card={card}
              index={index}
              totalCount={flashcards.length}
              onUpdate={(field, value) => onUpdate(index, field, value)}
              onRemove={() => onRemove(index)}
              onMove={(direction) => onMove(index, direction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
