import { useState, useEffect, useCallback } from 'react';
import { FolderData, FolderDataResponse, FileItem, Folder } from '@/types/folder';
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
    updateFolder: () => {},
    addFolder: () => {},
  });

  const updateFolder = useCallback((updatedFolder: Folder) => {
    setData(prev => {
      // Update current folder if it's the one being renamed
      const updatedCurrentFolder = prev.folder?.id === updatedFolder.id ? updatedFolder : prev.folder;
      
      // Update breadcrumbs if any breadcrumb matches the updated folder
      const updatedBreadcrumbs = prev.breadcrumbs.map(breadcrumb => 
        breadcrumb.id === updatedFolder.id 
          ? { ...breadcrumb, name: updatedFolder.name }
          : breadcrumb
      );

      return {
        ...prev,
        folder: updatedCurrentFolder,
        breadcrumbs: updatedBreadcrumbs,
      };
    });
  }, []);

  const addFolder = useCallback((newFolder: Folder) => {
    setData(prev => {
      // Add the new folder to the files list (only if it belongs to the current folder)
      // Check if the new folder belongs to the current folder or is a root folder (when we're on dashboard)
      const shouldAddToCurrentView = (
        (!folderId && !newFolder.parent_id) || // Root folder when on dashboard
        (folderId && newFolder.parent_id === folderId) // Child folder when in a specific folder
      );

      if (!shouldAddToCurrentView) {
        return prev; // Don't add folder if it doesn't belong to current view
      }

      // Create new folder item for the table display
      const newFolderItem: FileItem = {
        id: newFolder.id,
        name: newFolder.name,
        type: 'folder' as const,
        created_at: newFolder.created_at,
      };

      // Add to files list and sort
      const updatedFiles = [...prev.files, newFolderItem].sort((a, b) => {
        // Sort folders first, then by name
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        ...prev,
        files: updatedFiles,
      };
    });
  }, [folderId]);

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
          })),
          ...cachedData.contents.files.map(file => ({
            ...file,
          }))
        ];

        setData({
          folder: cachedData.folder,
          breadcrumbs: cachedData.breadcrumbs,
          files: combinedFiles,
          loading: false,
          error: null,
          refetch: fetchFolderData,
          updateFolder,
          addFolder,
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
          created_at: folder.created_at,
        })),
        ...result.contents.files.map(file => ({
          ...file,
        }))
      ];

      setData({
        folder: result.folder,
        breadcrumbs: result.breadcrumbs,
        files: combinedFiles,
        loading: false,
        error: null,
        refetch: fetchFolderData,
        updateFolder,
        addFolder,
      });
    } catch (err) {
      console.error('Failed to fetch folder data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load folder data'
      }));
    }
  }, [folderId, getToken, updateFolder, addFolder]);

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