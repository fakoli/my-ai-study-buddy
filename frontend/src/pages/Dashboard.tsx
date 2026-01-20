import { useAuthContext } from '../components/common/AuthProvider';
import { StreakDisplay } from '../components/dashboard/StreakDisplay';
import { ProgressChart } from '../components/dashboard/ProgressChart';
import { ActionCard } from '../components/dashboard/ActionCard';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { useProgressStats, useTopicMastery } from '../hooks/useProgress';
import { useDueCards } from '../hooks/useReviews';
import { BookOpen, Brain, Target, Clock } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuthContext();
  const { data: stats, isLoading: statsLoading } = useProgressStats();
  const { data: topics } = useTopicMastery();
  const { data: dueCards } = useDueCards(1);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-500">Here's your learning progress</p>
      </div>

      <StreakDisplay
        currentStreak={stats?.current_streak ?? 0}
        longestStreak={stats?.longest_streak ?? 0}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          type="review"
          count={dueCards?.total_due ?? 0}
          title="Review Cards"
          description="Practice with spaced repetition"
          href="/review"
        />
        <ActionCard
          type="quiz"
          title="Take a Quiz"
          description="Test your knowledge"
          href="/decks"
        />
        <ActionCard
          type="study"
          title="Browse Decks"
          description="View and manage your decks"
          href="/decks"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart topics={topics?.topics ?? []} />

        <Card>
          <CardHeader>
            <h3 className="font-medium text-gray-900">Statistics</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.total_cards_reviewed ?? 0}
                </div>
                <div className="text-sm text-gray-500">Cards Reviewed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.total_quizzes_completed ?? 0}
                </div>
                <div className="text-sm text-gray-500">Quizzes Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(stats?.accuracy_rate ?? 0)}%
                </div>
                <div className="text-sm text-gray-500">Accuracy Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.time_spent_minutes ?? 0}
                </div>
                <div className="text-sm text-gray-500">Minutes Studied</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
