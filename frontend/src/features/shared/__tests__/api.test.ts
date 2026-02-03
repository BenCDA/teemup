import * as SecureStore from 'expo-secure-store';
import { setTokens, getAccessToken, getRefreshToken, clearTokens } from '../api';

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    describe('setTokens', () => {
      it('should store both access and refresh tokens', async () => {
        const accessToken = 'test-access-token';
        const refreshToken = 'test-refresh-token';

        await setTokens(accessToken, refreshToken);

        expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', accessToken);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', refreshToken);
      });
    });

    describe('getAccessToken', () => {
      it('should retrieve the access token from secure store', async () => {
        const mockToken = 'stored-access-token';
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(mockToken);

        const result = await getAccessToken();

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('accessToken');
        expect(result).toBe(mockToken);
      });

      it('should return null when no token is stored', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

        const result = await getAccessToken();

        expect(result).toBeNull();
      });
    });

    describe('getRefreshToken', () => {
      it('should retrieve the refresh token from secure store', async () => {
        const mockToken = 'stored-refresh-token';
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(mockToken);

        const result = await getRefreshToken();

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('refreshToken');
        expect(result).toBe(mockToken);
      });

      it('should return null when no token is stored', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

        const result = await getRefreshToken();

        expect(result).toBeNull();
      });
    });

    describe('clearTokens', () => {
      it('should delete both access and refresh tokens', async () => {
        await clearTokens();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
      });
    });
  });
});
