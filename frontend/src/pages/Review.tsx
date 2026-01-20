import { ReviewSession } from '../components/flashcards/ReviewSession';

export function Review() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Session</h1>
        <p className="text-gray-500">Practice your flashcards with spaced repetition</p>
      </div>

      <ReviewSession />
    </div>
  );
}
