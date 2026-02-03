import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import api, { setTokens, clearTokens, getAccessToken } from '@/features/shared/api';
import socketService from '@/features/shared/socket';

// Mock the api module
jest.mock('@/features/shared/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
}));

// Mock socket service
jest.mock('@/features/shared/socket', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  profilePicture: null,
  bio: null,
  sports: [],
  city: null,
  latitude: null,
  longitude: null,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockAuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: mockUser,
};

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockResolvedValue(null);
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth on mount', () => {
    it('should fetch user when token exists', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('existing-token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(socketService.connect).toHaveBeenCalled();
    });

    it('should clear tokens and set user to null when fetch fails', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('invalid-token');
      (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);
      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(socketService.connect).toHaveBeenCalled();
    });

    it('should throw error on login failure', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);
      (api.post as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);
      (api.post as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register(
          'test@example.com',
          'Password123!',
          'John',
          'Doe',
          'base64-image-data'
        );
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        verificationImage: 'base64-image-data',
      });
      expect(setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('existing-token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });
      (api.post as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(clearTokens).toHaveBeenCalled();
      expect(socketService.disconnect).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should logout locally even if API call fails', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('existing-token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });
      (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear tokens and disconnect even if API fails
      expect(clearTokens).toHaveBeenCalled();
      expect(socketService.disconnect).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshUser', () => {
    it('should refresh user data', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = { ...mockUser, firstName: 'Jane' };
      (api.get as jest.Mock).mockResolvedValue({ data: updatedUser });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(updatedUser);
    });

    it('should logout on refresh failure', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });
      (api.post as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user with optimistic update and API response', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updates = { firstName: 'Jane', bio: 'New bio' };
      const updatedUser = { ...mockUser, ...updates };
      (api.put as jest.Mock).mockResolvedValue({ data: updatedUser });

      await act(async () => {
        await result.current.updateUser(updates);
      });

      expect(api.put).toHaveBeenCalledWith('/users/me', updates);
      expect(result.current.user).toEqual(updatedUser);
    });

    it('should rollback on API failure', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue('token');
      (api.get as jest.Mock).mockResolvedValue({ data: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      const updates = { firstName: 'Jane' };
      (api.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        act(async () => {
          await result.current.updateUser(updates);
        })
      ).rejects.toThrow('Update failed');

      // Should rollback to original user
      expect(result.current.user).toEqual(mockUser);
    });
  });
});
