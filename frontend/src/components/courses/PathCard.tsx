import { Link } from 'react-router-dom';
import { Map, BookOpen, Clock, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import type { LearningPathResponse, CourseDifficulty } from '../../types';

interface PathCardProps {
  path: LearningPathResponse;
  onOptions?: () => void;
}

const difficultyColors: Record<CourseDifficulty, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function PathCard({ path, onOptions }: PathCardProps) {
  const colors = difficultyColors[path.difficulty];

  return (
    <Link to={`/paths/${path.id}`}>
      <Card className="card-interactive h-full">
        <CardContent className="flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Map className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {path.title}
                </h3>
              </div>
            </div>
            {onOptions && (
              <button
                className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Path options"
                onClick={(e) => {
                  e.preventDefault();
                  onOptions();
                }}
              >
                <MoreVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </button>
            )}
          </div>

          {path.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {path.description}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>{path.course_count} {path.course_count === 1 ? 'course' : 'courses'}</span>
            </div>
            {path.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>~{path.estimated_hours}h</span>
              </div>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {path.difficulty}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
