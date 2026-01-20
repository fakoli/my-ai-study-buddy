import { Link } from 'react-router-dom';
import { Plus, BookOpen, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import type { DeckResponse } from '../../types';

interface DeckListProps {
  decks: DeckResponse[];
  onCreateDeck: () => void;
}

export function DeckList({ decks, onCreateDeck }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No decks yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first deck to start learning
          </p>
          <Button onClick={onCreateDeck}>
            <Plus className="w-4 h-4 mr-2" />
            Create Deck
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Link key={deck.id} to={`/decks/${deck.id}`}>
          <Card className="hover:shadow-md transition-shadow h-full">
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
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
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
      <Card
        className="border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors"
        onClick={onCreateDeck}
      >
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[150px]">
          <Plus className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">Create Deck</span>
        </CardContent>
      </Card>
    </div>
  );
}
