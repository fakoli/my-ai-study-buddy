import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userSettingsApi } from '../api/userSettings';
import type { APIProvider, UserAPISettingsCreate } from '../types';

const QUERY_KEY = 'apiKeys';

/** Fetch all configured API keys for the current user */
export function useApiKeys() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => userSettingsApi.listApiKeys(),
  });
}

/** Set or update an API key */
export function useSetApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserAPISettingsCreate) => userSettingsApi.setApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Delete an API key */
export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: APIProvider) => userSettingsApi.deleteApiKey(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Validate an API key */
export function useValidateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: APIProvider) => userSettingsApi.validateApiKey(provider),
    onSuccess: () => {
      // Refresh the keys list to update validity status
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
