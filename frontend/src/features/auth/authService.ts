import api from '@/features/shared/api';
import { AuthResponse, User, FaceVerificationResponse } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    verificationImage: string,
    isPro: boolean = false
  ): Promise<AuthResponse> => {
    // Registration includes face verification which can take up to 2 minutes on first load
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      verificationImage,
      isPro,
    }, { timeout: 120000 });
    return response.data;
  },

  verifyFace: async (image: string): Promise<FaceVerificationResponse> => {
    // Face verification can take up to 2 minutes on first load (model loading)
    const response = await api.post<FaceVerificationResponse>('/verification/face', {
      image,
    }, { timeout: 120000 });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },
};
