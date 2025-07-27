import { UserResponse } from '@/types/user';
import { FolderDataResponse, Folder } from '@/types/folder';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response.json();
}

export const userApi = {
  getCurrentUser: (token: string): Promise<UserResponse> => 
    apiRequest<UserResponse>('/user/me', token),
};

export const folderApi = {
  // Get folder data (root or specific folder)
  getFolderData: (token: string, folderId?: string): Promise<FolderDataResponse> => {
    const endpoint = folderId ? `/folders/${folderId}` : '/folders';
    return apiRequest<FolderDataResponse>(endpoint, token);
  },

  // Get all folders for tree view
  getAllFolders: (token: string): Promise<{ folders: Folder[] }> =>
    apiRequest<{ folders: Folder[] }>('/folders/all', token),

  // Create a new folder
  createFolder: (token: string, data: { name: string; parent_id?: string | null }): Promise<Folder> =>
    apiRequest<Folder>('/folders', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a folder
  updateFolder: (token: string, folderId: string, data: { name: string }): Promise<Folder> =>
    apiRequest<Folder>(`/folders/${folderId}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete a folder
  deleteFolder: (token: string, folderId: string): Promise<void> =>
    apiRequest<void>(`/folders/${folderId}`, token, {
      method: 'DELETE',
    }),
};