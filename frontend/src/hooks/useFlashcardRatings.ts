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

/**
 * Hook to get both ratings and summary in a single API call.
 *
 * This is more efficient than using useFlashcardRatings and useFlashcardRatingSummary
 * separately, as it reduces API calls from 2 to 1.
 */
export function useFlashcardRatingsWithSummary(courseId: string, moduleId: string) {
  return useQuery({
    queryKey: ['flashcard-ratings', 'with-summary', courseId, moduleId],
    queryFn: () => flashcardRatingsApi.getRatingsWithSummary(courseId, moduleId),
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

interface RateFlashcardParams {
  courseId: string;
  moduleId: string;
  flashcardIndex: number;
  flashcardId?: string;
  rating: FlashcardRating;
}

/**
 * Hook for rating flashcards with optimistic updates.
 *
 * When a rating is submitted:
 * 1. Optimistically updates the cache immediately (instant UI feedback)
 * 2. Sends the request to the server
 * 3. On error, rolls back to the previous state
 */
export function useRateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      flashcardIndex,
      flashcardId,
      rating,
    }: RateFlashcardParams) =>
      flashcardRatingsApi.rateFlashcard(courseId, moduleId, {
        flashcard_index: flashcardIndex,
        flashcard_id: flashcardId,
        rating,
      }),

    // Optimistic update before server response
    onMutate: async ({ courseId, moduleId, flashcardIndex, rating }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['flashcard-ratings', courseId, moduleId],
      });
      await queryClient.cancelQueries({
        queryKey: ['flashcard-ratings', 'summary', courseId, moduleId],
      });
      await queryClient.cancelQueries({
        queryKey: ['flashcard-ratings', 'with-summary', courseId, moduleId],
      });

      // Snapshot the previous values for potential rollback
      const previousRatings = queryClient.getQueryData<
        import('../types').FlashcardRatingRecord[]
      >(['flashcard-ratings', courseId, moduleId]);

      const previousSummary = queryClient.getQueryData<
        import('../types').FlashcardRatingSummary
      >(['flashcard-ratings', 'summary', courseId, moduleId]);

      const previousWithSummary = queryClient.getQueryData<
        import('../api/flashcardRatings').RatingsWithSummaryResponse
      >(['flashcard-ratings', 'with-summary', courseId, moduleId]);

      // Optimistically update the ratings
      if (previousRatings) {
        const existingRatingIndex = previousRatings.findIndex(
          (r) => r.flashcard_index === flashcardIndex
        );

        const newRatings = [...previousRatings];
        const now = new Date().toISOString();

        if (existingRatingIndex !== -1) {
          // Update existing rating
          newRatings[existingRatingIndex] = {
            ...newRatings[existingRatingIndex],
            rating,
            updated_at: now,
          };
        } else {
          // Add new rating (simplified - will be replaced on refetch)
          newRatings.push({
            id: `optimistic-${flashcardIndex}`,
            user_id: '',
            course_id: courseId,
            module_id: moduleId,
            flashcard_index: flashcardIndex,
            rating,
            created_at: now,
            updated_at: now,
          } as import('../types').FlashcardRatingRecord);
        }

        queryClient.setQueryData(
          ['flashcard-ratings', courseId, moduleId],
          newRatings
        );
      }

      // Return context with previous values for rollback
      return { previousRatings, previousSummary, previousWithSummary };
    },

    // Rollback on error
    onError: (err, { courseId, moduleId }, context) => {
      if (context?.previousRatings) {
        queryClient.setQueryData(
          ['flashcard-ratings', courseId, moduleId],
          context.previousRatings
        );
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(
          ['flashcard-ratings', 'summary', courseId, moduleId],
          context.previousSummary
        );
      }
      if (context?.previousWithSummary) {
        queryClient.setQueryData(
          ['flashcard-ratings', 'with-summary', courseId, moduleId],
          context.previousWithSummary
        );
      }
    },

    // Refetch after success to ensure consistency with server
    onSettled: (_, __, { courseId, moduleId }) => {
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', courseId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', 'summary', courseId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', 'with-summary', courseId, moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['flashcard-ratings', 'filtered', courseId, moduleId],
      });
    },
  });
}
