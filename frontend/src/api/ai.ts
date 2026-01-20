import { api } from './client';
import type {
  AIResponse,
  ExamplesRequest,
  ExplainRequest,
  HintRequest,
  SimplifyRequest,
} from '../types';

export const aiApi = {
  explain: (data: ExplainRequest) => api.post<AIResponse>('/ai/explain', data),

  hint: (data: HintRequest) => api.post<AIResponse>('/ai/hint', data),

  examples: (data: ExamplesRequest) => api.post<AIResponse>('/ai/examples', data),

  simplify: (data: SimplifyRequest) => api.post<AIResponse>('/ai/simplify', data),
};
