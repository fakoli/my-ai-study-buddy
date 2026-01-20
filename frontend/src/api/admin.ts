import { api } from './client';
import type {
  AdminStatsResponse,
  AdjustTokensRequest,
  AdjustTokensResponse,
  UserDetailResponse,
  UserListResponse,
} from '../types';

export const adminApi = {
  getStats: () => api.get<AdminStatsResponse>('/admin/stats'),

  listUsers: (params?: { skip?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return api.get<UserListResponse>(`/admin/users${query ? `?${query}` : ''}`);
  },

  getUserDetail: (userId: string) =>
    api.get<UserDetailResponse>(`/admin/users/${userId}`),

  adjustTokens: (userId: string, data: AdjustTokensRequest) =>
    api.put<AdjustTokensResponse>(`/admin/users/${userId}/tokens`, data),
};
