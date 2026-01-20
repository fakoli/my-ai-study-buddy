import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../api/progress';

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

export function useTopicMastery() {
  return useQuery({
    queryKey: ['progress', 'topics'],
    queryFn: progressApi.getTopics,
  });
}
