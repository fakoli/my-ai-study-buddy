import { api } from './client';
import type {
  CourseProgressStatus,
  DashboardStats,
  NextUpResponse,
  PathProgressStatus,
  ProgressStats,
  RecentActivityResponse,
  SessionsResponse,
  TopicMasteryResponse,
} from '../types';

export const progressApi = {
  // New dashboard endpoints
  getDashboardStats: () => api.get<DashboardStats>('/progress/dashboard'),

  getRecentActivity: (limit = 20) =>
    api.get<RecentActivityResponse>(`/progress/activity?limit=${limit}`),

  getNextUp: (limit = 3) =>
    api.get<NextUpResponse>(`/progress/next-up?limit=${limit}`),

  getCourseProgress: (courseId: string) =>
    api.get<CourseProgressStatus>(`/progress/courses/${courseId}`),

  getPathProgress: (pathId: string) =>
    api.get<PathProgressStatus>(`/progress/paths/${pathId}`),

  // Legacy endpoints (deprecated)
  /** @deprecated Use getDashboardStats instead */
  getStats: () => api.get<ProgressStats>('/progress/stats'),

  getSessions: (limit = 20, offset = 0) =>
    api.get<SessionsResponse>(`/progress/sessions?limit=${limit}&offset=${offset}`),

  /** @deprecated Use getCourseProgress instead */
  getTopics: () => api.get<TopicMasteryResponse>('/progress/topics'),
};
