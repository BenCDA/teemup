import { eventService, CreateEventRequest } from '../eventService';
import { api } from '@/features/shared/api';

jest.mock('@/features/shared/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicEvents', () => {
    it('should fetch public events', async () => {
      const events = [{ id: '1', sport: 'football' }];
      mockApi.get.mockResolvedValue({ data: { content: events } });

      const result = await eventService.getPublicEvents();

      expect(mockApi.get).toHaveBeenCalledWith('/events/public', {
        params: { page: 0, size: 20 },
      });
      expect(result).toEqual(events);
    });
  });

  describe('getNearbyEvents', () => {
    it('should fetch nearby events with params', async () => {
      const events = [{ id: '1' }];
      mockApi.get.mockResolvedValue({ data: events });

      const params = { latitude: 48.85, longitude: 2.35, maxDistance: 10 };
      const result = await eventService.getNearbyEvents(params);

      expect(mockApi.get).toHaveBeenCalledWith('/events/nearby', { params });
      expect(result).toEqual(events);
    });

    it('should throw on invalid latitude', async () => {
      await expect(
        eventService.getNearbyEvents({ latitude: 200, longitude: 2.35 })
      ).rejects.toThrow('Latitude invalide');
    });

    it('should throw on invalid longitude', async () => {
      await expect(
        eventService.getNearbyEvents({ latitude: 48.85, longitude: -200 })
      ).rejects.toThrow('Longitude invalide');
    });
  });

  describe('getMyEvents', () => {
    it('should fetch user events', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await eventService.getMyEvents();

      expect(mockApi.get).toHaveBeenCalledWith('/events/me');
    });
  });

  describe('getEventById', () => {
    it('should fetch event by id', async () => {
      const event = { id: '123', sport: 'tennis' };
      mockApi.get.mockResolvedValue({ data: event });

      const result = await eventService.getEventById('123');

      expect(mockApi.get).toHaveBeenCalledWith('/events/123');
      expect(result).toEqual(event);
    });
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const newEvent = { sport: 'football', date: '2025-06-01', startTime: '10:00', endTime: '12:00' };
      const created = { id: '1', ...newEvent };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await eventService.createEvent(newEvent as CreateEventRequest);

      expect(mockApi.post).toHaveBeenCalledWith('/events', newEvent);
      expect(result).toEqual(created);
    });

    it('should validate coordinates on create', async () => {
      await expect(
        eventService.createEvent({
          sport: 'football', date: '2025-06-01', startTime: '10:00', endTime: '12:00',
          latitude: 100, longitude: 2.35,
        })
      ).rejects.toThrow('Latitude invalide');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      mockApi.delete.mockResolvedValue({});

      await eventService.deleteEvent('123');

      expect(mockApi.delete).toHaveBeenCalledWith('/events/123');
    });
  });

  describe('joinEvent', () => {
    it('should join an event', async () => {
      const event = { id: '123', isParticipating: true };
      mockApi.post.mockResolvedValue({ data: event });

      const result = await eventService.joinEvent('123');

      expect(mockApi.post).toHaveBeenCalledWith('/events/123/join');
      expect(result).toEqual(event);
    });
  });

  describe('leaveEvent', () => {
    it('should leave an event', async () => {
      const event = { id: '123', isParticipating: false };
      mockApi.delete.mockResolvedValue({ data: event });

      const result = await eventService.leaveEvent('123');

      expect(mockApi.delete).toHaveBeenCalledWith('/events/123/leave');
      expect(result).toEqual(event);
    });
  });
});
