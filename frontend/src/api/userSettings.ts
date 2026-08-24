import { api } from './client';

export interface AIConnectionStatus {
  provider: string;
  is_configured: boolean;
  is_reachable: boolean;
  model: string | null;
  message: string;
}

export const userSettingsApi = {
  /**
   * Check that the server's Anvil router is configured and reachable.
   * No per-user API keys are managed — AI runs on a shared self-hosted router.
   */
  checkAIConnection: () => api.get<AIConnectionStatus>('/auth/ai-connection'),
};
