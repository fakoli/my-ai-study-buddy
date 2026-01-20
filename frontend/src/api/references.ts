import { api } from './client';
import type { ReferenceContent, ReferencesResponse } from '../types';

interface ReferenceVisualsResponse {
  visuals: Array<{
    name: string;
    path: string;
    url: string;
  }>;
}

export const referencesApi = {
  list: () => api.get<ReferencesResponse>('/references'),

  get: (topic: string, module?: string) => {
    const params = module ? `?module=${module}` : '';
    return api.get<ReferenceContent>(`/references/${topic}${params}`);
  },

  getVisuals: (topic: string, module?: string) => {
    const params = module ? `?module=${module}` : '';
    return api.get<ReferenceVisualsResponse>(`/references/${topic}/visuals${params}`);
  },
};
