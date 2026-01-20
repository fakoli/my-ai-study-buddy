import { api } from './client';
import type { TokenResponse, User, UserCreate, UserLogin } from '../types';

export const authApi = {
  register: (data: UserCreate) => api.post<User>('/auth/register', data),

  login: (data: UserLogin) => api.post<TokenResponse>('/auth/login', data),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  getTokenBalance: () => api.get<{ balance: number }>('/auth/tokens'),

  consumeTokens: (amount: number) =>
    api.post<{ balance: number }>('/auth/tokens/consume', { amount }),
};
