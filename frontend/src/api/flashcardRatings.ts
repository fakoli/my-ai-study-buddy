import { api } from './client';
import type {
  FilteredFlashcardsResponse,
  FlashcardFilter,
  FlashcardRatingRecord,
  FlashcardRatingResponse,
  FlashcardRatingSummary,
  RateFlashcardRequest,
} from '../types';

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
