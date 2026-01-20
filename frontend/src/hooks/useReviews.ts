import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews';
import type { ReviewCreate } from '../types';

export function useDueCards(limit = 20) {
  return useQuery({
    queryKey: ['dueCards', limit],
    queryFn: () => reviewsApi.getDue(limit),
  });
}

export function useReviewHistory(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['reviewHistory', limit, offset],
    queryFn: () => reviewsApi.getHistory(limit, offset),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewCreate) => reviewsApi.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dueCards'] });
      queryClient.invalidateQueries({ queryKey: ['reviewHistory'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
