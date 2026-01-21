import { Plus } from 'lucide-react';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { CourseCard } from './CourseCard';
import type { CourseResponse } from '../../types';

interface CourseListProps {
  courses: CourseResponse[];
  onCreateCourse: () => void;
  onAddToPath?: (courseId: string) => void;
  showAuthor?: boolean;
  showCreateButton?: boolean;
}

export function CourseList({
  courses,
  onCreateCourse,
  onAddToPath,
  showAuthor = true,
  showCreateButton = true,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="/images/empty-no-courses.png"
          title="No courses yet"
          description="Create your first course to start building learning content"
          action={{
            label: 'Create Course',
            onClick: onCreateCourse,
            icon: Plus,
          }}
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          showAuthor={showAuthor}
          onAddToPath={onAddToPath ? () => onAddToPath(course.id) : undefined}
        />
      ))}
      {showCreateButton && (
        <button
          onClick={onCreateCourse}
          className="rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Create new course"
        >
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] p-4">
            <Plus className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">Create Course</span>
          </div>
        </button>
      )}
    </div>
  );
}
