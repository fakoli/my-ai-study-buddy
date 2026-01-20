import { api } from './client';
import type { ProgressStats, SessionsResponse, TopicMasteryResponse } from '../types';

export const progressApi = {
  getStats: () => api.get<ProgressStats>('/progress/stats'),

  getSessions: (limit = 20, offset = 0) =>
    api.get<SessionsResponse>(`/progress/sessions?limit=${limit}&offset=${offset}`),

  getTopics: () => api.get<TopicMasteryResponse>('/progress/topics'),
};
