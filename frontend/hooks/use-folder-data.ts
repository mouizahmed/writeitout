import { useState, useEffect, useCallback } from 'react';
import { FolderData, FolderDataResponse, FileItem, Folder } from '@/types/folder';
import { useAuth } from '@clerk/nextjs';
import { folderApi } from '@/lib/api';

// Cache for folder data to avoid unnecessary refetches
const folderDataCache = new Map<string, FolderDataResponse>();

// Cache for folder tree data
let folderTreeCache: Folder[] | null = null;
let folderTreeUpdateListeners: (() => void)[] = [];

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
    deleteFolder: () => {},
  });

  const updateFolder = useCallback((updatedFolder: Folder) => {
    // Update cache first
    updateFolderInCache(updatedFolder);
    
    // Refresh data from cache to trigger re-render
    const cacheKey = folderId || 'root';
    const cachedData = folderDataCache.get(cacheKey);
    
    if (cachedData) {
      const combinedFiles = [
        ...cachedData.contents.folders.map(folder => ({
          ...folder,
          type: 'folder' as const,
        })),
        ...cachedData.contents.files.map(file => ({
          ...file,
        }))
      ];

      setData(prev => ({
        ...prev,
        folder: cachedData.folder,
        breadcrumbs: cachedData.breadcrumbs,
        files: combinedFiles,
      }));
    }
  }, [folderId]);

  const addFolder = useCallback((newFolder: Folder) => {
    // Add to cache first
    addFolderToCache(newFolder.parent_id, newFolder);
    
    // Refresh data from cache to trigger re-render (only if belongs to current view)
    const shouldUpdateCurrentView = (
      (!folderId && !newFolder.parent_id) || // Root folder when on dashboard
      (folderId && newFolder.parent_id === folderId) // Child folder when in a specific folder
    );

    if (shouldUpdateCurrentView) {
      const cacheKey = folderId || 'root';
      const cachedData = folderDataCache.get(cacheKey);
      
      if (cachedData) {
        const combinedFiles = [
          ...cachedData.contents.folders.map(folder => ({
            ...folder,
            type: 'folder' as const,
          })),
          ...cachedData.contents.files.map(file => ({
            ...file,
          }))
        ];

        setData(prev => ({
          ...prev,
          files: combinedFiles,
        }));
      }
    }
  }, [folderId]);

  const deleteFolder = useCallback((deletedFolderId: string) => {
    // Remove from cache first
    removeFolderFromCache(deletedFolderId, folderId);
    
    // Refresh data from cache to trigger re-render
    const cacheKey = folderId || 'root';
    const cachedData = folderDataCache.get(cacheKey);
    
    if (cachedData) {
      const combinedFiles = [
        ...cachedData.contents.folders.map(folder => ({
          ...folder,
          type: 'folder' as const,
        })),
        ...cachedData.contents.files.map(file => ({
          ...file,
        }))
      ];

      setData(prev => ({
        ...prev,
        files: combinedFiles,
      }));
    }
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
          deleteFolder,
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
        deleteFolder,
      });
    } catch (err) {
      console.error('Failed to fetch folder data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load folder data'
      }));
    }
  }, [folderId, getToken, updateFolder, addFolder, deleteFolder]);

  // Refetch data when folderId changes
  useEffect(() => {
    fetchFolderData();
  }, [fetchFolderData]);

  return data;
}


// Helper function to add a new folder to existing cache
export function addFolderToCache(parentFolderId: string | null, newFolder: Folder) {
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
  }
  
  // Update folder tree cache
  addFolderToTreeCache(newFolder);
  
  return existingData ? true : false;
}

// Helper function to update a folder in existing cache
export function updateFolderInCache(updatedFolder: Folder) {
  // Update folder data cache
  for (const [cacheKey, cacheData] of folderDataCache.entries()) {
    let hasUpdates = false;
    
    // Update if this is the current folder
    if (cacheData.folder?.id === updatedFolder.id) {
      cacheData.folder = updatedFolder;
      hasUpdates = true;
    }
    
    // Update if folder exists in the folders list
    const folderIndex = cacheData.contents.folders.findIndex(f => f.id === updatedFolder.id);
    if (folderIndex !== -1) {
      cacheData.contents.folders[folderIndex] = updatedFolder;
      hasUpdates = true;
    }
    
    // Update breadcrumbs
    const originalBreadcrumbs = JSON.stringify(cacheData.breadcrumbs);
    cacheData.breadcrumbs = cacheData.breadcrumbs.map(breadcrumb => 
      breadcrumb.id === updatedFolder.id 
        ? { ...breadcrumb, name: updatedFolder.name }
        : breadcrumb
    );
    if (JSON.stringify(cacheData.breadcrumbs) !== originalBreadcrumbs) {
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      folderDataCache.set(cacheKey, cacheData);
    }
  }
  
  // Update folder tree cache
  updateFolderInTreeCache(updatedFolder);
}

// Helper function to remove a folder from existing cache
export function removeFolderFromCache(folderId: string, parentFolderId: string | null) {
  // Remove the folder from its parent's cache
  const parentCacheKey = parentFolderId || 'root';
  const parentData = folderDataCache.get(parentCacheKey);
  
  if (parentData) {
    const updatedData = {
      ...parentData,
      contents: {
        ...parentData.contents,
        folders: parentData.contents.folders.filter(f => f.id !== folderId)
      },
      stats: {
        ...parentData.stats,
        total_folders: parentData.stats.total_folders - 1
      }
    };
    folderDataCache.set(parentCacheKey, updatedData);
  }
  
  // Remove the folder's own cache entry
  folderDataCache.delete(folderId);
  
  // Remove from any other cache entries where it might appear in breadcrumbs
  for (const [cacheKey, cacheData] of folderDataCache.entries()) {
    const originalBreadcrumbs = JSON.stringify(cacheData.breadcrumbs);
    cacheData.breadcrumbs = cacheData.breadcrumbs.filter(breadcrumb => breadcrumb.id !== folderId);
    
    if (JSON.stringify(cacheData.breadcrumbs) !== originalBreadcrumbs) {
      folderDataCache.set(cacheKey, cacheData);
    }
  }
  
  // Update folder tree cache
  removeFolderFromTreeCache(folderId);
}


// Folder tree cache management
export function getFolderTreeCache(): Folder[] | null {
  return folderTreeCache;
}

export function setFolderTreeCache(folders: Folder[]) {
  folderTreeCache = folders;
  // Notify all listeners that tree cache has changed
  folderTreeUpdateListeners.forEach(listener => listener());
}

export function clearFolderTreeCache() {
  folderTreeCache = null;
}

export function updateFolderInTreeCache(updatedFolder: Folder) {
  if (folderTreeCache) {
    const folderIndex = folderTreeCache.findIndex(f => f.id === updatedFolder.id);
    if (folderIndex !== -1) {
      folderTreeCache[folderIndex] = updatedFolder;
      // Notify listeners of cache change
      folderTreeUpdateListeners.forEach(listener => listener());
    }
  }
}

export function addFolderToTreeCache(newFolder: Folder) {
  if (folderTreeCache) {
    folderTreeCache.push(newFolder);
    // Notify listeners of cache change
    folderTreeUpdateListeners.forEach(listener => listener());
  }
}

export function removeFolderFromTreeCache(folderId: string) {
  if (folderTreeCache) {
    folderTreeCache = folderTreeCache.filter(f => f.id !== folderId);
    // Notify listeners of cache change
    folderTreeUpdateListeners.forEach(listener => listener());
  }
}

// Subscribe to folder tree cache changes
export function subscribeFolderTreeUpdates(listener: () => void) {
  folderTreeUpdateListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    folderTreeUpdateListeners = folderTreeUpdateListeners.filter(l => l !== listener);
  };
}