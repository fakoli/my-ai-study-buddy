import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { useDeck, useAddCard, useDeleteCard, useDeleteDeck } from '../hooks/useDecks';

export function DeckDetail() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId!);
  const addCard = useAddCard();
  const deleteCard = useDeleteCard();
  const deleteDeck = useDeleteDeck();

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
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard.mutateAsync({ deckId: deckId!, cardId });
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    }
  };

  const handleDeleteDeck = async () => {
    if (confirm('Are you sure you want to delete this deck and all its cards?')) {
      try {
        await deleteDeck.mutateAsync(deckId!);
        navigate('/decks');
      } catch (error) {
        console.error('Failed to delete deck:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Deck not found</h2>
        <Link to="/decks" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to decks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/decks"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
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
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setIsAddCardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        {deck.cards.length > 0 && (
          <Link to={`/quiz/${deckId}`}>
            <Button variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </Link>
        )}
      </div>

      {deck.cards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No cards yet
            </h3>
            <p className="text-gray-500 mb-4">
              Add some cards to start learning
            </p>
            <Button onClick={() => setIsAddCardOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deck.cards.map((card) => (
            <Card key={card.id} variant="bordered">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">{card.front}</p>
                    <p className="text-sm text-gray-500">{card.back}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
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
          <div className="space-y-1">
            <label
              htmlFor="front"
              className="block text-sm font-medium text-gray-700"
            >
              Front (Question)
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question or prompt"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="back"
              className="block text-sm font-medium text-gray-700"
            >
              Back (Answer)
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
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
