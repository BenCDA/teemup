import { api, getAccessToken } from '@/features/shared/api';

interface UploadResponse {
  url: string;
  type: string;
}

export async function uploadProfilePicture(uri: string): Promise<string> {
  const formData = createFormData(uri, 'profile');
  const response = await uploadFile('/upload/profile-picture', formData);
  return response.url;
}

export async function uploadCoverImage(uri: string): Promise<string> {
  const formData = createFormData(uri, 'cover');
  const response = await uploadFile('/upload/cover-image', formData);
  return response.url;
}

export async function uploadImage(uri: string, folder: string = 'misc'): Promise<string> {
  const formData = createFormData(uri, folder);
  const response = await uploadFile(`/upload/image?folder=${folder}`, formData);
  return response.url;
}

function createFormData(uri: string, name: string): FormData {
  const formData = new FormData();

  // Get the file extension from the URI
  const uriParts = uri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  // Create the file object for React Native
  const file = {
    uri,
    name: `${name}.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as unknown as Blob;

  formData.append('file', file);

  return formData;
}

async function uploadFile(endpoint: string, formData: FormData): Promise<UploadResponse> {
  const token = await getAccessToken();

  const response = await api.post<UploadResponse>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : '',
    },
    transformRequest: (data) => data, // Prevent axios from transforming FormData
  });

  return response.data;
}

export const uploadService = {
  uploadProfilePicture,
  uploadCoverImage,
  uploadImage,
};

export default uploadService;
