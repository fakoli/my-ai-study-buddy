import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { User, UserCreate, UserLogin } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
