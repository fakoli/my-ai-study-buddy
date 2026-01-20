import { Link } from 'react-router-dom';
import { BookOpen, Users, Sparkles, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../common/Card';
import type { CourseResponse, CourseDifficulty } from '../../types';

interface CourseCardProps {
  course: CourseResponse;
  onOptions?: () => void;
  onAddToPath?: () => void;
  showAuthor?: boolean;
}

const difficultyColors: Record<CourseDifficulty, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function CourseCard({ course, onOptions, onAddToPath, showAuthor = true }: CourseCardProps) {
  const colors = difficultyColors[course.difficulty];

  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="card-interactive h-full">
        <CardContent className="flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600" aria-hidden="true" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {course.title}
                  </h3>
                  {course.ai_enabled && (
                    <span title="AI-Assisted Course">
                      <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    </span>
                  )}
                </div>
                {showAuthor && (
                  <p className="text-xs text-gray-500">by {course.author_name}</p>
                )}
              </div>
            </div>
            {onOptions && (
              <button
                className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Course options"
                onClick={(e) => {
                  e.preventDefault();
                  onOptions();
                }}
              >
                <MoreVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </button>
            )}
          </div>

          {course.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {course.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{course.tags.length - 3}</span>
            )}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>{course.module_count} {course.module_count === 1 ? 'module' : 'modules'}</span>
              {course.times_added > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" aria-hidden="true" />
                  <span>{course.times_added}</span>
                </div>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {course.difficulty}
            </span>
          </div>

          {onAddToPath && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToPath();
              }}
              className="mt-3 w-full py-2 px-3 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              + Add to Path
            </button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
