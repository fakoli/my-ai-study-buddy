import {
  BookOpen,
  CheckCircle,
  Clock,
  Flame,
  GraduationCap,
  Target,
} from 'lucide-react';
import type { DashboardStats } from '../../types';

interface StatsGridProps {
  stats: DashboardStats;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
        value={stats.active_paths}
        label="Active Paths"
        color="bg-indigo-50"
      />
      <StatCard
        icon={<BookOpen className="w-5 h-5 text-blue-600" />}
        value={stats.courses_in_progress}
        label="Courses In Progress"
        color="bg-blue-50"
      />
      <StatCard
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        value={stats.modules_completed_week}
        label="Modules This Week"
        color="bg-green-50"
      />
      <StatCard
        icon={<Target className="w-5 h-5 text-purple-600" />}
        value={
          stats.average_quiz_score !== null
            ? `${Math.round(stats.average_quiz_score)}%`
            : '-'
        }
        label="Quiz Average"
        color="bg-purple-50"
      />
      <StatCard
        icon={<Clock className="w-5 h-5 text-orange-600" />}
        value={formatTime(stats.total_study_time_minutes)}
        label="Total Study Time"
        color="bg-orange-50"
      />
      <StatCard
        icon={<Flame className="w-5 h-5 text-red-600" />}
        value={stats.current_streak}
        label="Day Streak"
        color="bg-red-50"
      />
    </div>
  );
}
