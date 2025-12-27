import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '@/types';
import api, { setTokens, clearTokens, getAccessToken } from '@/features/shared/api';
import socketService from '@/features/shared/socket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, verificationImage: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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

  const register = async (email: string, password: string, firstName: string, lastName: string, verificationImage: string) => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      verificationImage,
    });
    await setTokens(response.data.accessToken, response.data.refreshToken);
    setUser(response.data.user);
    await socketService.connect();
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors during logout
    }
    await clearTokens();
    socketService.disconnect();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
    } catch (error) {
      await logout();
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
