import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../api/progress';

// New hooks for path/course/module progress

export function useDashboardStats() {
  return useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.getDashboardStats,
  });
}

export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: ['progress', 'activity', limit],
    queryFn: () => progressApi.getRecentActivity(limit),
  });
}

export function useNextUp(limit = 3) {
  return useQuery({
    queryKey: ['progress', 'next-up', limit],
    queryFn: () => progressApi.getNextUp(limit),
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', 'courses', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });
}

export function usePathProgress(pathId: string) {
  return useQuery({
    queryKey: ['progress', 'paths', pathId],
    queryFn: () => progressApi.getPathProgress(pathId),
    enabled: !!pathId,
  });
}

// Legacy hooks (deprecated)

/** @deprecated Use useDashboardStats instead */
export function useProgressStats() {
  return useQuery({
    queryKey: ['progress', 'stats'],
    queryFn: progressApi.getStats,
  });
}

export function useSessions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['progress', 'sessions', limit, offset],
    queryFn: () => progressApi.getSessions(limit, offset),
  });
}

/** @deprecated Use useCourseProgress instead */
export function useTopicMastery() {
  return useQuery({
    queryKey: ['progress', 'topics'],
    queryFn: progressApi.getTopics,
  });
}
