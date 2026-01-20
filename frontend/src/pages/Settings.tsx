import { useState } from 'react';
import { useAuthContext } from '../components/common/AuthProvider';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useNotificationPreferences, useUpdateNotificationPreferences, useTestEmail, useTestSms } from '../hooks/useNotifications';

export function Settings() {
  const { user, logout } = useAuthContext();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const testEmail = useTestEmail();
  const testSms = useTestSms();

  const [phoneNumber, setPhoneNumber] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <h3 className="font-medium text-gray-900">Profile</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Token Balance</label>
            <p className="mt-1 text-gray-900">{user?.token_balance} tokens</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-medium text-gray-900">Notifications</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email notifications</p>
              <p className="text-sm text-gray-500">Receive reminders and updates via email</p>
            </div>
            <button
              onClick={() => updatePrefs.mutate({ email_enabled: !prefs?.email_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs?.email_enabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs?.email_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Daily quiz</p>
              <p className="text-sm text-gray-500">Receive a daily quiz via SMS</p>
            </div>
            <button
              onClick={() => updatePrefs.mutate({ daily_quiz_enabled: !prefs?.daily_quiz_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs?.daily_quiz_enabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs?.daily_quiz_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="phone"
                  label="Phone Number"
                  value={phoneNumber || prefs?.phone_number || ''}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  if (phoneNumber) {
                    updatePrefs.mutate({ phone_number: phoneNumber, sms_enabled: true });
                  }
                }}
                isLoading={updatePrefs.isPending}
              >
                Save
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testEmail.mutate()}
              isLoading={testEmail.isPending}
            >
              Test Email
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testSms.mutate()}
              isLoading={testSms.isPending}
              disabled={!prefs?.phone_number}
            >
              Test SMS
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-medium text-gray-900">Account</h3>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={logout}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
