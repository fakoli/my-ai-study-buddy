import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { authApi } from '../api/auth';
import type { User, UserCreate, UserLogin } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Subscribe to localStorage changes from other tabs
 */
function subscribeToStorageChanges(callback: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'token') {
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * Get current token from localStorage (snapshot function)
 */
function getTokenSnapshot(): string | null {
  return localStorage.getItem('token');
}

/**
 * Server snapshot function (for SSR - returns null)
 */
function getServerTokenSnapshot(): string | null {
  return null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Use useSyncExternalStore for cross-tab sync of token changes
  // This will trigger a re-render when the token changes in localStorage
  // (including from other tabs)
  const token = useSyncExternalStore(
    subscribeToStorageChanges,
    getTokenSnapshot,
    getServerTokenSnapshot
  );

  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authApi.me();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Re-check auth when token changes (including from other tabs)
  useEffect(() => {
    checkAuth();
  }, [checkAuth, token]);

  const login = async (credentials: UserLogin) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('token', response.access_token);
    await checkAuth();
  };

  const register = async (data: UserCreate) => {
    await authApi.register(data);
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
    checkAuth,
  };
}
