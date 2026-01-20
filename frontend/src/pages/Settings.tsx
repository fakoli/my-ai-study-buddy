import { useState } from 'react';
import { useAuthContext } from '../components/common/AuthProvider';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useNotificationPreferences, useUpdateNotificationPreferences, useTestEmail, useTestSms } from '../hooks/useNotifications';
import { useApiKeys, useSetApiKey, useDeleteApiKey, useValidateApiKey } from '../hooks/useUserSettings';
import type { APIProvider } from '../types';

export function Settings() {
  const { user, logout } = useAuthContext();
  const { data: prefs, isLoading: prefsLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const testEmail = useTestEmail();
  const testSms = useTestSms();

  // API Keys
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const setApiKey = useSetApiKey();
  const deleteApiKey = useDeleteApiKey();
  const validateApiKey = useValidateApiKey();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>('anthropic');
  const [validationMessage, setValidationMessage] = useState<{ provider: string; message: string; success: boolean } | null>(null);

  const isLoading = prefsLoading || keysLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const handleSetApiKey = async () => {
    if (!newApiKey) return;
    try {
      await setApiKey.mutateAsync({ provider: selectedProvider, api_key: newApiKey });
      setNewApiKey('');
      setValidationMessage({ provider: selectedProvider, message: 'API key saved successfully', success: true });
    } catch {
      setValidationMessage({ provider: selectedProvider, message: 'Failed to save API key', success: false });
    }
  };

  const handleValidateKey = async (provider: APIProvider) => {
    try {
      const result = await validateApiKey.mutateAsync(provider);
      setValidationMessage({
        provider,
        message: result.message,
        success: result.is_valid,
      });
    } catch {
      setValidationMessage({ provider, message: 'Validation failed', success: false });
    }
  };

  const handleDeleteKey = async (provider: APIProvider) => {
    try {
      await deleteApiKey.mutateAsync(provider);
      setValidationMessage({ provider, message: 'API key deleted', success: true });
    } catch {
      setValidationMessage({ provider, message: 'Failed to delete API key', success: false });
    }
  };

  const getKeyForProvider = (provider: APIProvider) => {
    return apiKeys?.find((k) => k.provider === provider);
  };

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
          <h3 className="font-medium text-gray-900">API Keys</h3>
          <p className="text-sm text-gray-500 mt-1">
            Provide your own API keys to use AI features. Your keys are encrypted before storage.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Anthropic Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Anthropic (Claude)</p>
                <p className="text-sm text-gray-500">Used for AI-powered content generation</p>
              </div>
              {getKeyForProvider('anthropic') && (
                <span className={`text-xs px-2 py-1 rounded ${getKeyForProvider('anthropic')?.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {getKeyForProvider('anthropic')?.is_valid ? 'Valid' : 'Invalid'}
                </span>
              )}
            </div>
            {getKeyForProvider('anthropic') ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-600">
                  {getKeyForProvider('anthropic')?.key_hint}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleValidateKey('anthropic')}
                  isLoading={validateApiKey.isPending}
                >
                  Validate
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteKey('anthropic')}
                  isLoading={deleteApiKey.isPending}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={selectedProvider === 'anthropic' ? newApiKey : ''}
                  onChange={(e) => {
                    setSelectedProvider('anthropic');
                    setNewApiKey(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedProvider('anthropic');
                    handleSetApiKey();
                  }}
                  isLoading={setApiKey.isPending && selectedProvider === 'anthropic'}
                  disabled={selectedProvider !== 'anthropic' || !newApiKey}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Gemini Key */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Google Gemini</p>
                <p className="text-sm text-gray-500">Used for AI-powered image generation</p>
              </div>
              {getKeyForProvider('gemini') && (
                <span className={`text-xs px-2 py-1 rounded ${getKeyForProvider('gemini')?.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {getKeyForProvider('gemini')?.is_valid ? 'Valid' : 'Invalid'}
                </span>
              )}
            </div>
            {getKeyForProvider('gemini') ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-600">
                  {getKeyForProvider('gemini')?.key_hint}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleValidateKey('gemini')}
                  isLoading={validateApiKey.isPending}
                >
                  Validate
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteKey('gemini')}
                  isLoading={deleteApiKey.isPending}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza..."
                  value={selectedProvider === 'gemini' ? newApiKey : ''}
                  onChange={(e) => {
                    setSelectedProvider('gemini');
                    setNewApiKey(e.target.value);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedProvider('gemini');
                    handleSetApiKey();
                  }}
                  isLoading={setApiKey.isPending && selectedProvider === 'gemini'}
                  disabled={selectedProvider !== 'gemini' || !newApiKey}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Validation message */}
          {validationMessage && (
            <div className={`p-3 rounded text-sm ${validationMessage.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {validationMessage.message}
            </div>
          )}
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
