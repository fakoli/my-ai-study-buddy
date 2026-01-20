import { Link } from 'react-router-dom';
import { Plus, BookOpen, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import type { DeckResponse } from '../../types';

interface DeckListProps {
  decks: DeckResponse[];
  onCreateDeck: () => void;
}

export function DeckList({ decks, onCreateDeck }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={BookOpen}
          title="No decks yet"
          description="Create your first deck to start learning with flashcards"
          action={{
            label: 'Create Deck',
            onClick: onCreateDeck,
            icon: Plus,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Link key={deck.id} to={`/decks/${deck.id}`}>
          <Card className="card-interactive h-full">
            <CardContent className="flex flex-col h-full">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {deck.title}
                  </h3>
                  {deck.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                </div>
                <button
                  className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="Deck options"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-auto pt-4">
                <span className="text-sm text-gray-500">
                  {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      <button
        onClick={onCreateDeck}
        className="rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Create new deck"
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] p-4">
          <Plus className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-600">Create Deck</span>
        </div>
      </button>
    </div>
  );
}
