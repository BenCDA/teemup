import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadService } from '@/services/uploadService';

interface UseImageUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useImageUpload(options?: UseImageUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickAndUploadProfilePicture = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const url = await uploadService.uploadProfilePicture(result.assets[0].uri);
      options?.onSuccess?.(url);
      return url;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  }, [options]);

  const pickAndUploadCoverImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const url = await uploadService.uploadCoverImage(result.assets[0].uri);
      options?.onSuccess?.(url);
      return url;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  }, [options]);

  const uploadFromUri = useCallback(
    async (uri: string, type: 'profile' | 'cover' | 'generic' = 'generic') => {
      setIsUploading(true);
      setProgress(0);

      try {
        let url: string;
        switch (type) {
          case 'profile':
            url = await uploadService.uploadProfilePicture(uri);
            break;
          case 'cover':
            url = await uploadService.uploadCoverImage(uri);
            break;
          default:
            url = await uploadService.uploadImage(uri);
        }
        options?.onSuccess?.(url);
        return url;
      } catch (error) {
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsUploading(false);
        setProgress(100);
      }
    },
    [options]
  );

  return {
    isUploading,
    progress,
    pickAndUploadProfilePicture,
    pickAndUploadCoverImage,
    uploadFromUri,
  };
}
