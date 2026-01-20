import { api } from './client';
import type {
  APIProvider,
  UserAPISettingsCreate,
  UserAPISettingsResponse,
  UserAPISettingsValidateResponse,
} from '../types';

interface DeleteKeyResponse {
  message: string;
}

export const userSettingsApi = {
  /**
   * List all configured API keys for the current user.
   * Returns only key hints (last 4 characters), not the actual keys.
   */
  listApiKeys: () => api.get<UserAPISettingsResponse[]>('/auth/api-keys'),

  /**
   * Set or update an API key for a provider.
   * The API key will be encrypted before storage.
   */
  setApiKey: (data: UserAPISettingsCreate) =>
    api.post<UserAPISettingsResponse>('/auth/api-keys', data),

  /**
   * Delete an API key for a specific provider.
   */
  deleteApiKey: (provider: APIProvider) =>
    api.delete<DeleteKeyResponse>(`/auth/api-keys/${provider}`),

  /**
   * Validate that a stored API key works.
   * Makes a test request to the provider's API to verify the key is valid.
   */
  validateApiKey: (provider: APIProvider) =>
    api.post<UserAPISettingsValidateResponse>(`/auth/api-keys/${provider}/validate`),
};
