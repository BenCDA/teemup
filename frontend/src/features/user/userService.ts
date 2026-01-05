import api from '@/features/shared/api';
import { User, SportEvent } from '@/types';

export const userService = {
  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  getUserFriends: async (userId: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${userId}/friends`);
    return response.data;
  },

  getUserEvents: async (userId: string): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>(`/events/user/${userId}`);
    return response.data;
  },

  getMyEvents: async (): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>('/events/me');
    return response.data;
  },

  getMyUpcomingEvents: async (): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>('/events/me/upcoming');
    return response.data;
  },

  createEvent: async (event: Omit<SportEvent, 'id' | 'userId'>): Promise<SportEvent> => {
    const response = await api.post<SportEvent>('/events', event);
    return response.data;
  },

  updateEvent: async (eventId: string, event: Omit<SportEvent, 'id' | 'userId'>): Promise<SportEvent> => {
    const response = await api.put<SportEvent>(`/events/${eventId}`, event);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}`);
  },
};
