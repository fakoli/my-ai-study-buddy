import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashcardRatingsApi } from '../api/flashcardRatings';
import type { FlashcardFilter, FlashcardRating } from '../types';

export function useFlashcardRatings(courseId: string, moduleId: string) {
  return useQuery({
    queryKey: ['flashcard-ratings', courseId, moduleId],
    queryFn: () => flashcardRatingsApi.getUserRatings(courseId, moduleId),
    enabled: !!courseId && !!moduleId,
  });
}

export function useFlashcardRatingSummary(courseId: string, moduleId: string) {
  return useQuery({
    queryKey: ['flashcard-ratings', 'summary', courseId, moduleId],
    queryFn: () => flashcardRatingsApi.getRatingSummary(courseId, moduleId),
    enabled: !!courseId && !!moduleId,
  });
}

export function useFilteredFlashcards(
  courseId: string,
  moduleId: string,
  filterBy?: FlashcardFilter
) {
  return useQuery({
    queryKey: ['flashcard-ratings', 'filtered', courseId, moduleId, filterBy],
    queryFn: () => flashcardRatingsApi.getFilteredFlashcards(courseId, moduleId, filterBy),
    enabled: !!courseId && !!moduleId,
  });
}

export function useRateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      flashcardIndex,
      flashcardId,
      rating,
    }: {
      courseId: string;
      moduleId: string;
      flashcardIndex: number;
      flashcardId?: string;
      rating: FlashcardRating;
    }) =>
      flashcardRatingsApi.rateFlashcard(courseId, moduleId, {
        flashcard_index: flashcardIndex,
        flashcard_id: flashcardId,
        rating,
      }),
    onSuccess: (_, { courseId, moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', courseId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', 'summary', courseId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', 'filtered', courseId, moduleId],
      });
    },
  });
}
