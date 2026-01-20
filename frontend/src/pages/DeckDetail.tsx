import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Trash2, Layers } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Textarea } from '../components/common/Textarea';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton, SkeletonText } from '../components/common/Skeleton';
import { useDeck, useAddCard, useDeleteCard, useDeleteDeck } from '../hooks/useDecks';
import { useToast } from '../hooks/useToast';

function DeckDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck details">
      <span className="sr-only">Loading deck details...</span>
      <div className="flex items-center gap-4" aria-hidden="true">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
      <div className="flex gap-2" aria-hidden="true">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeckDetail() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId!);
  const addCard = useAddCard();
  const deleteCard = useDeleteCard();
  const deleteDeck = useDeleteDeck();
  const { success, error: showError } = useToast();

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCard.mutateAsync({ deckId: deckId!, data: { front, back } });
      setIsAddCardOpen(false);
      setFront('');
      setBack('');
      success('Card added successfully');
    } catch (err) {
      console.error('Failed to add card:', err);
      showError('Failed to add card. Please try again.');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard.mutateAsync({ deckId: deckId!, cardId });
        success('Card deleted');
      } catch (err) {
        console.error('Failed to delete card:', err);
        showError('Failed to delete card. Please try again.');
      }
    }
  };

  const handleDeleteDeck = async () => {
    if (confirm('Are you sure you want to delete this deck and all its cards?')) {
      try {
        await deleteDeck.mutateAsync(deckId!);
        success('Deck deleted');
        navigate('/decks');
      } catch (err) {
        console.error('Failed to delete deck:', err);
        showError('Failed to delete deck. Please try again.');
      }
    }
  };

  if (isLoading) {
    return <DeckDetailSkeleton />;
  }

  if (!deck) {
    return (
      <Card>
        <EmptyState
          title="Deck not found"
          description="The deck you're looking for doesn't exist or has been deleted."
          action={{
            label: 'Back to decks',
            onClick: () => navigate('/decks'),
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-4">
        <Link
          to="/decks"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Back to decks"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{deck.title}</h1>
          {deck.description && (
            <p className="text-gray-500">{deck.description}</p>
          )}
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteDeck}
          aria-label="Delete deck"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setIsAddCardOpen(true)} className="btn-press">
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Card
        </Button>
        {deck.cards.length > 0 && (
          <Link to={`/quiz/${deckId}`}>
            <Button variant="secondary" className="btn-press">
              <Play className="w-4 h-4 mr-2" aria-hidden="true" />
              Start Quiz
            </Button>
          </Link>
        )}
      </div>

      {deck.cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No cards yet"
            description="Add some flashcards to this deck to start learning"
            action={{
              label: 'Add Your First Card',
              onClick: () => setIsAddCardOpen(true),
              icon: Plus,
            }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deck.cards.map((card) => (
            <Card key={card.id} variant="bordered" className="card-interactive">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">{card.front}</p>
                    <p className="text-sm text-gray-500">{card.back}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Delete card"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Add New Card"
      >
        <form onSubmit={handleAddCard} className="space-y-4">
          <Textarea
            id="front"
            label="Front (Question)"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Enter the question or prompt"
            rows={3}
            required
          />
          <Textarea
            id="back"
            label="Back (Answer)"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Enter the answer"
            rows={3}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddCardOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addCard.isPending}>
              Add Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
