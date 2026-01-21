import { Plus } from 'lucide-react';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { PathCard } from './PathCard';
import type { LearningPathResponse } from '../../types';

interface PathListProps {
  paths: LearningPathResponse[];
  onCreatePath: () => void;
}

export function PathList({ paths, onCreatePath }: PathListProps) {
  if (paths.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="/images/empty-no-paths.png"
          title="No learning paths yet"
          description="Create your first learning path to organize courses into a structured journey"
          action={{
            label: 'Create Learning Path',
            onClick: onCreatePath,
            icon: Plus,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paths.map((path) => (
        <PathCard key={path.id} path={path} />
      ))}
      <button
        onClick={onCreatePath}
        className="rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Create new learning path"
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] p-4">
          <Plus className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-600">Create Path</span>
        </div>
      </button>
    </div>
  );
}
