import { useState, useEffect, useCallback } from 'react';
import { FolderData, FolderDataResponse, FileItem } from '@/types/folder';
import { useAuth } from '@clerk/nextjs';
import { folderApi } from '@/lib/api';

// Cache for folder data to avoid unnecessary refetches
const folderDataCache = new Map<string, FolderDataResponse>();

export function useFolderData(folderId: string | null): FolderData {
  const { getToken } = useAuth();
  const [data, setData] = useState<FolderData>({
    folder: null,
    breadcrumbs: [{ id: null, name: "Dashboard", href: "/dashboard" }],
    files: [],
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchFolderData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const cacheKey = folderId || 'root';
      
      // Check cache first
      if (folderDataCache.has(cacheKey)) {
        const cachedData = folderDataCache.get(cacheKey)!;
        const combinedFiles = [
          ...cachedData.contents.folders.map(folder => ({
            ...folder,
            type: 'folder' as const,
            created: folder.created_at,
          })),
          ...cachedData.contents.files.map(file => ({
            ...file,
            created: file.created_at,
          }))
        ];

        setData({
          folder: cachedData.folder,
          breadcrumbs: cachedData.breadcrumbs,
          files: combinedFiles,
          loading: false,
          error: null,
          refetch: fetchFolderData,
        });
        return;
      }

      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch from centralized API
      const result: FolderDataResponse = await folderApi.getFolderData(token, folderId || undefined);

      console.log("Response:", result)
      
      // Cache the result
      folderDataCache.set(cacheKey, result);
      
      // Combine folders and files for table display
      const combinedFiles: FileItem[] = [
        ...result.contents.folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          created: folder.created_at,
          created_at: folder.created_at,
        })),
        ...result.contents.files.map(file => ({
          ...file,
          created: file.created_at,
        }))
      ];

      setData({
        folder: result.folder,
        breadcrumbs: result.breadcrumbs,
        files: combinedFiles,
        loading: false,
        error: null,
        refetch: fetchFolderData,
      });
    } catch (err) {
      console.error('Failed to fetch folder data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load folder data'
      }));
    }
  }, [folderId, getToken]);

  // Refetch data when folderId changes
  useEffect(() => {
    fetchFolderData();
  }, [fetchFolderData]);

  return data;
}

// Helper function to clear cache when data changes
export function clearFolderCache(folderId?: string | null) {
  if (folderId) {
    folderDataCache.delete(folderId);
  } else {
    folderDataCache.clear();
  }
}

// Helper function to update cache after folder operations
export function updateFolderCache(folderId: string | null, data: FolderDataResponse) {
  const cacheKey = folderId || 'root';
  folderDataCache.set(cacheKey, data);
}

// Helper function to add a new folder to existing cache
export function addFolderToCache(parentFolderId: string | null, newFolder: any) {
  const cacheKey = parentFolderId || 'root';
  const existingData = folderDataCache.get(cacheKey);
  
  if (existingData) {
    // Add the new folder to the existing folders list
    const updatedData = {
      ...existingData,
      contents: {
        ...existingData.contents,
        folders: [...existingData.contents.folders, newFolder].sort((a, b) => a.name.localeCompare(b.name))
      },
      stats: {
        ...existingData.stats,
        total_folders: existingData.stats.total_folders + 1
      }
    };
    folderDataCache.set(cacheKey, updatedData);
    return true;
  }
  return false;
}