import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import clsx from 'clsx';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  variant?: 'light' | 'dark';
}

export function StreakDisplay({ currentStreak, longestStreak, variant = 'light' }: StreakDisplayProps) {
  const isDark = variant === 'dark';

  return (
    <Card className={clsx(isDark && 'bg-white/10 backdrop-blur-sm border-white/20')}>
      <CardContent className="flex items-center justify-around py-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className={clsx('text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {currentStreak}
            </span>
          </div>
          <p className={clsx('text-sm', isDark ? 'text-white/70' : 'text-gray-500')}>Current Streak</p>
        </div>
        <div className={clsx('h-12 w-px', isDark ? 'bg-white/20' : 'bg-gray-200')} />
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className={clsx('text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {longestStreak}
            </span>
          </div>
          <p className={clsx('text-sm', isDark ? 'text-white/70' : 'text-gray-500')}>Longest Streak</p>
        </div>
      </CardContent>
    </Card>
  );
}
