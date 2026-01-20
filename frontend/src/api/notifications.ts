import { api } from './client';
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from '../types';

interface NotificationHistoryResponse {
  notifications: Array<{
    id: string;
    user_id: string;
    channel: string;
    notification_type: string;
    content: string;
    sent_at: string;
    delivered: boolean;
    delivery_status: string | null;
  }>;
  total: number;
}

interface TestNotificationResponse {
  success: boolean;
  message: string;
}

export const notificationsApi = {
  getPreferences: () => api.get<NotificationPreferences>('/notifications/preferences'),

  updatePreferences: (data: NotificationPreferencesUpdate) =>
    api.put<NotificationPreferences>('/notifications/preferences', data),

  getHistory: (limit = 50, offset = 0) =>
    api.get<NotificationHistoryResponse>(`/notifications/history?limit=${limit}&offset=${offset}`),

  testEmail: () => api.post<TestNotificationResponse>('/notifications/test/email'),

  testSms: () => api.post<TestNotificationResponse>('/notifications/test/sms'),
};
