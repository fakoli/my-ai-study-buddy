import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { User, UserCreate, UserLogin } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'token';

/** Subscribe to token changes from other tabs */
function subscribeToStorageChanges(callback: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Always read the token fresh from localStorage — never capture it in a
  // closure. A stale captured value is what used to wipe valid sessions on
  // re-render (token verified OK by /auth/me, then removed moments later).
  const checkAuth = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authApi.me();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      // Only clear the token if it is still the one we verified. If a
      // concurrent login replaced it in the meantime, leave the new token
      // alone and re-check it instead of destroying a fresh session.
      const latest = localStorage.getItem(TOKEN_KEY);
      if (latest === currentToken) {
        localStorage.removeItem(TOKEN_KEY);
      }
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Re-check on mount and whenever the token in storage changes (including
  // from other tabs). checkAuth is stable, so this effect cannot re-fire in
  // a loop.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Cross-tab session sync: when another tab logs in or out (which writes or
  // removes the token in shared localStorage), the browser fires a `storage`
  // event in this tab. Re-run the same fresh-read checkAuth so both tabs
  // converge on the same session state. checkAuth is stable, so this effect
  // attaches once and cleans up its listener on unmount.
  useEffect(() => subscribeToStorageChanges(checkAuth), [checkAuth]);

  const login = async (credentials: UserLogin) => {
    const response = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    // Set state directly from the verified token; do not round-trip through
    // checkAuth here so a stale concurrent call cannot race us.
    try {
      const user = await authApi.me();
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('Login failed');
    }
  };

  const register = async (data: UserCreate) => {
    await authApi.register(data);
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
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
