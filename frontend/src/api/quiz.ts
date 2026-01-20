import { api } from './client';
import type {
  Quiz,
  QuizGenerateRequest,
  QuizSubmission,
  QuizSubmitRequest,
  QuizWithSubmission,
} from '../types';

export const quizApi = {
  generate: (data: QuizGenerateRequest) => api.post<Quiz>('/quiz/generate', data),

  submit: (data: QuizSubmitRequest) => api.post<QuizSubmission>('/quiz/submit', data),

  get: (quizId: string) => api.get<QuizWithSubmission>(`/quiz/${quizId}`),
};
