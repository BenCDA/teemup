import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, AuthResponse } from '@/types';
import api, { setTokens, clearTokens, getAccessToken, onSessionExpired } from '@/features/shared/api';
import socketService from '@/features/shared/socket';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, verificationImage: string, isPro?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionExpired = useCallback(() => {
    // Only show alert if user was logged in
    if (user) {
      setUser(null);
      socketService.disconnect();
      Alert.alert(
        'Session expiree',
        'Votre session a expire. Veuillez vous reconnecter.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for session expiration events
  useEffect(() => {
    const unsubscribe = onSessionExpired(handleSessionExpired);
    return unsubscribe;
  }, [handleSessionExpired]);

  const checkAuth = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const response = await api.get<User>('/auth/me');
        setUser(response.data);
        await socketService.connect();
      }
    } catch (error) {
      await clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    await setTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);
    await socketService.connect();
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, verificationImage: string, isPro: boolean = false) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      verificationImage,
      isPro,
    });
    await setTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);
    await socketService.connect();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // API logout failed, continue with local cleanup
    } finally {
      await clearTokens();
      socketService.disconnect();
      setUser(null);
      router.replace('/(auth)/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
    } catch (error) {
      await logout();
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    const previousUser = user;
    // Optimistic update
    setUser((prev) => (prev ? { ...prev, ...updates } : null));

    try {
      const response = await api.put<User>('/users/me', updates);
      setUser(response.data);
    } catch (error) {
      // Rollback on error
      setUser(previousUser);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
