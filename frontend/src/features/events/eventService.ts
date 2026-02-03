import { api } from '@/features/shared/api';
import { SportEvent } from '@/types';

export interface CreateEventRequest {
  sport: string;
  title?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  date: string;
  startTime: string;
  endTime: string;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  isPublic?: boolean;
  maxParticipants?: number;
  isPaid?: boolean;
  price?: number;
}

export interface NearbyEventsParams {
  latitude: number;
  longitude: number;
  maxDistance?: number;
  sport?: string;
}

export const eventService = {
  getPublicEvents: async (): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>('/events/public');
    return response.data;
  },

  getNearbyEvents: async (params: NearbyEventsParams): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>('/events/nearby', { params });
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

  getUserEvents: async (userId: string): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>(`/events/user/${userId}`);
    return response.data;
  },

  getEventById: async (eventId: string): Promise<SportEvent> => {
    const response = await api.get<SportEvent>(`/events/${eventId}`);
    return response.data;
  },

  createEvent: async (data: CreateEventRequest): Promise<SportEvent> => {
    const response = await api.post<SportEvent>('/events', data);
    return response.data;
  },

  updateEvent: async (eventId: string, data: Partial<CreateEventRequest>): Promise<SportEvent> => {
    const response = await api.put<SportEvent>(`/events/${eventId}`, data);
    return response.data;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}`);
  },

  getEventsBySport: async (sport: string): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>(`/events/public/sport/${sport}`);
    return response.data;
  },

  // Participation
  joinEvent: async (eventId: string): Promise<SportEvent> => {
    const response = await api.post<SportEvent>(`/events/${eventId}/join`);
    return response.data;
  },

  leaveEvent: async (eventId: string): Promise<SportEvent> => {
    const response = await api.delete<SportEvent>(`/events/${eventId}/leave`);
    return response.data;
  },

  getParticipatingEvents: async (): Promise<SportEvent[]> => {
    const response = await api.get<SportEvent[]>('/events/me/participating');
    return response.data;
  },
};

export default eventService;
