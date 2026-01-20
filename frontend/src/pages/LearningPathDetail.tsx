import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Clock,
  BookOpen,
  GripVertical,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  useLearningPath,
  useDeleteLearningPath,
  useRemoveCourseFromPath,
} from '../hooks/useLearningPaths';
import { useDiscoverCourses } from '../hooks/useCourses';
import { useAddCourseToPath } from '../hooks/useLearningPaths';
import { useToast } from '../hooks/useToast';
import type { CourseDifficulty, CourseResponse } from '../types';

const difficultyColors: Record<CourseDifficulty, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function LearningPathDetail() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { data, isLoading, error } = useLearningPath(pathId || '');
  const deletePath = useDeleteLearningPath();
  const removeCourse = useRemoveCourseFromPath();
  const addCourse = useAddCourseToPath();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addCourseModalOpen, setAddCourseModalOpen] = useState(false);
  const [courseToRemove, setCourseToRemove] = useState<CourseResponse | null>(null);

  // Fetch available courses for adding
  const { data: discoverData } = useDiscoverCourses({ limit: 50 });

  const handleDeletePath = async () => {
    if (!pathId) return;
    try {
      await deletePath.mutateAsync(pathId);
      success('Learning path deleted successfully');
      navigate('/paths');
    } catch (err) {
      console.error('Failed to delete path:', err);
      showError('Failed to delete learning path. Please try again.');
    }
  };

  const handleRemoveCourse = async () => {
    if (!pathId || !courseToRemove) return;
    try {
      await removeCourse.mutateAsync({ pathId, courseId: courseToRemove.id });
      success('Course removed from path');
      setCourseToRemove(null);
    } catch (err) {
      console.error('Failed to remove course:', err);
      showError('Failed to remove course. Please try again.');
    }
  };

  const handleAddCourse = async (courseId: string) => {
    if (!pathId) return;
    try {
      await addCourse.mutateAsync({ pathId, courseId });
      success('Course added to path');
      setAddCourseModalOpen(false);
    } catch (err) {
      console.error('Failed to add course:', err);
      showError('Failed to add course. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Learning path not found</h2>
        <p className="text-gray-500 mt-2">The learning path you're looking for doesn't exist.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/paths')}>
          Back to Learning Paths
        </Button>
      </div>
    );
  }

  const { path, courses } = data;
  const colors = difficultyColors[path.difficulty];

  // Filter out courses already in the path
  const availableCourses = discoverData?.courses.filter(
    (c) => !path.course_ids.includes(c.id)
  ) ?? [];

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{path.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 mt-1">
              <span>{courses.length} courses</span>
              {path.estimated_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{path.estimated_hours}h
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAddCourseModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
          <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Path Info */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {path.description && (
              <p className="text-gray-600 w-full">{path.description}</p>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
              {path.difficulty}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Courses */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Courses</h2>
        </CardHeader>
        <CardContent className="p-0">
          {courses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No courses in this path yet</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setAddCourseModalOpen(true)}
              >
                Add First Course
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-gray-400">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-medium text-gray-900 truncate hover:text-indigo-600">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{course.module_count} modules</span>
                      <span className="text-xs">by {course.author_name}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setCourseToRemove(course)}
                    className="p-2 hover:bg-red-50 rounded"
                    title="Remove from path"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Path Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Learning Path"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{path.title}"? The courses will not be deleted.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePath}
              isLoading={deletePath.isPending}
            >
              Delete Path
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Course Modal */}
      <Modal
        isOpen={!!courseToRemove}
        onClose={() => setCourseToRemove(null)}
        title="Remove Course"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to remove "{courseToRemove?.title}" from this path?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCourseToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveCourse}
              isLoading={removeCourse.isPending}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Course Modal */}
      <Modal
        isOpen={addCourseModalOpen}
        onClose={() => setAddCourseModalOpen(false)}
        title="Add Course to Path"
      >
        <div className="space-y-4">
          {availableCourses.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleAddCourse(course.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium">{course.title}</div>
                  <div className="text-sm text-gray-500">
                    {course.module_count} modules · by {course.author_name}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No more courses available to add.</p>
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => {
                  setAddCourseModalOpen(false);
                  navigate('/courses?tab=discover');
                }}
              >
                Discover More Courses
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
