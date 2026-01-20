import { api } from './client';
import type {
  DueCardsResponse,
  Review,
  ReviewCreate,
  ReviewHistoryResponse,
} from '../types';

export const reviewsApi = {
  submit: (data: ReviewCreate) => api.post<Review>('/reviews', data),

  getDue: (limit = 20) => api.get<DueCardsResponse>(`/reviews/due?limit=${limit}`),

  getHistory: (limit = 50, offset = 0) =>
    api.get<ReviewHistoryResponse>(`/reviews/history?limit=${limit}&offset=${offset}`),
};
