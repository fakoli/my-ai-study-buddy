import { Card, CardContent, CardHeader } from '../common/Card';
import type { TopicMastery } from '../../types';

interface ProgressChartProps {
  topics: TopicMastery[];
}

export function ProgressChart({ topics }: ProgressChartProps) {
  if (topics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-medium text-gray-900">Topic Mastery</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Create some decks to see your progress here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-medium text-gray-900">Topic Mastery</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.topic} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{topic.topic}</span>
              <span className="text-gray-500">
                {topic.mastered_cards}/{topic.total_cards} mastered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${topic.mastery_percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
