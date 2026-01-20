import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '../common/Card';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-around py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-3xl font-bold text-gray-900">{currentStreak}</span>
          </div>
          <p className="text-sm text-gray-500">Current Streak</p>
        </div>
        <div className="h-12 w-px bg-gray-200" />
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-3xl font-bold text-gray-900">{longestStreak}</span>
          </div>
          <p className="text-sm text-gray-500">Longest Streak</p>
        </div>
      </CardContent>
    </Card>
  );
}
