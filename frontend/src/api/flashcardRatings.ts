import { api } from './client';
import type {
  FilteredFlashcardsResponse,
  FlashcardFilter,
  FlashcardRatingRecord,
  FlashcardRatingResponse,
  FlashcardRatingSummary,
  RateFlashcardRequest,
} from '../types';

/**
 * Combined response with ratings and summary
 */
export interface RatingsWithSummaryResponse {
  ratings: FlashcardRatingRecord[];
  summary: FlashcardRatingSummary;
}

export const flashcardRatingsApi = {
  rateFlashcard: (
    courseId: string,
    moduleId: string,
    data: RateFlashcardRequest
  ) =>
    api.post<FlashcardRatingResponse>(
      `/courses/${courseId}/modules/${moduleId}/flashcards/rate`,
      data
    ),

  getUserRatings: (courseId: string, moduleId: string) =>
    api.get<FlashcardRatingRecord[]>(
      `/courses/${courseId}/modules/${moduleId}/flashcards/ratings`
    ),

  getRatingSummary: (courseId: string, moduleId: string) =>
    api.get<FlashcardRatingSummary>(
      `/courses/${courseId}/modules/${moduleId}/flashcards/summary`
    ),

  /**
   * Get both ratings and summary in one API call.
   * More efficient than calling getUserRatings and getRatingSummary separately.
   */
  getRatingsWithSummary: (courseId: string, moduleId: string) =>
    api.get<RatingsWithSummaryResponse>(
      `/courses/${courseId}/modules/${moduleId}/flashcards/ratings-with-summary`
    ),

  getFilteredFlashcards: (
    courseId: string,
    moduleId: string,
    filterBy?: FlashcardFilter
  ) =>
    api.get<FilteredFlashcardsResponse>(
      `/courses/${courseId}/modules/${moduleId}/flashcards/filter${
        filterBy ? `?filter_by=${filterBy}` : ''
      }`
    ),
};
