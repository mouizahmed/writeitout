"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { folderApi } from '@/lib/api';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from '@/components/ui/sidebar';

interface FolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderNode[];
  expanded?: boolean;
}

interface FolderTreeProps {
  title?: string;
  onAddFolder?: (addFolderFn: (newFolder: any) => void) => void;
}

export function FolderTree({ title = "Folders", onAddFolder }: FolderTreeProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFolderTree();
  }, []);

  // Function to add a new folder to the tree without refetching
  const addFolderToTree = useCallback((newFolder: any) => {
    console.log('Adding folder to tree:', newFolder);
    
    setFolders(currentFolders => {
      // Create the new folder node
      const newFolderNode: FolderNode = {
        id: newFolder.id,
        name: newFolder.name,
        parent_id: newFolder.parent_id,
        children: [],
        expanded: false,
      };

      // If it's a root folder (no parent)
      if (!newFolder.parent_id) {
        const updatedRootFolders = [...currentFolders, newFolderNode];
        updatedRootFolders.sort((a, b) => a.name.localeCompare(b.name));
        return updatedRootFolders;
      }

      // Find the parent folder and add the new folder to its children
      const addToParent = (folders: FolderNode[]): FolderNode[] => {
        return folders.map(folder => {
          if (folder.id === newFolder.parent_id) {
            // Found the parent, add the new folder to its children
            const updatedChildren = [...(folder.children || []), newFolderNode];
            updatedChildren.sort((a, b) => a.name.localeCompare(b.name));
            
            // Auto-expand the parent to show the new folder
            setExpandedFolders(prev => new Set([...prev, folder.id]));
            
            return {
              ...folder,
              children: updatedChildren,
            };
          }
          
          // Recursively check children
          if (folder.children && folder.children.length > 0) {
            return {
              ...folder,
              children: addToParent(folder.children),
            };
          }
          
          return folder;
        });
      };

      return addToParent(currentFolders);
    });
  }, []);

  // Expose add folder function to parent component
  useEffect(() => {
    if (onAddFolder) {
      onAddFolder(addFolderToTree);
    }
  }, [onAddFolder, addFolderToTree]);

  const fetchFolderTree = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch all folders using centralized API
      const data = await folderApi.getAllFolders(token);
      console.log('All folders API response:', data); // Debug log
      
      // Build tree structure from flat folder list
      const folderTree = buildFolderTree(data.folders || []);
      console.log('Built folder tree:', folderTree); // Debug log
      setFolders(folderTree);
    } catch (error) {
      console.error('Failed to fetch folder tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (flatFolders: any[]): FolderNode[] => {
    console.log('Building tree from flat folders:', flatFolders); // Debug log
    
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create folder nodes
    flatFolders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id,
        children: [],
        expanded: false,
      });
    });

    // Build tree structure
    folderMap.forEach(folder => {
      if (folder.parent_id === null || folder.parent_id === "") {
        // Root level folder
        rootFolders.push(folder);
      } else {
        // Child folder
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(folder);
        } else {
          // Parent not found, treat as root level (orphaned folder)
          console.warn(`Parent folder ${folder.parent_id} not found for folder ${folder.name}`);
          rootFolders.push(folder);
        }
      }
    });

    // Sort all levels
    const sortFolders = (folders: FolderNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => {
        if (folder.children && folder.children.length > 0) {
          sortFolders(folder.children);
        }
      });
    };

    sortFolders(rootFolders);
    
    // Auto-expand folders that contain the current path
    autoExpandCurrentPath(rootFolders);
    
    return rootFolders;
  };

  const autoExpandCurrentPath = (folders: FolderNode[]) => {
    const currentFolderId = pathname.split('/').pop();
    if (currentFolderId && pathname.includes('/folder/')) {
      expandToFolder(folders, currentFolderId);
    }
  };

  const expandToFolder = (folders: FolderNode[], targetId: string): boolean => {
    for (const folder of folders) {
      if (folder.id === targetId) {
        // Found target, expand all parents leading to it
        setExpandedFolders(prev => new Set([...prev, folder.id]));
        return true;
      }
      
      if (folder.children && folder.children.length > 0) {
        if (expandToFolder(folder.children, targetId)) {
          // This folder contains the target, expand it
          setExpandedFolders(prev => new Set([...prev, folder.id]));
          return true;
        }
      }
    }
    return false;
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const navigateToFolder = (folderId: string) => {
    router.push(`/dashboard/folder/${folderId}`);
    setOpenMobile(false);
  };

  const isActivePath = (folderId: string) => {
    return pathname === `/dashboard/folder/${folderId}`;
  };

  const renderFolderNode = (folder: FolderNode, level: number = 0): React.ReactNode => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = isActivePath(folder.id);

    return (
      <SidebarMenuItem key={folder.id}>
        <div className="flex items-center w-max min-w-full">
          {/* Chevron button - separate from the main button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded mr-1"
              style={{ marginLeft: `${level * 12 + 4}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-5" style={{ marginLeft: `${level * 12 + 4}px` }} /> // Spacer for alignment
          )}
          
          {/* Main folder button */}
          <SidebarMenuButton
            onClick={() => navigateToFolder(folder.id)}
            isActive={isActive}
            tooltip={folder.name}
            className="hover:bg-amber-100/30 data-[active=true]:bg-amber-200/30 flex-1"
          >
            <div className="flex items-center gap-1 flex-1 whitespace-nowrap">
              {isExpanded && hasChildren ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              
              <span className="text-sm">{folder.name}</span>
            </div>
          </SidebarMenuButton>
        </div>

        {hasChildren && isExpanded && (
          <SidebarMenuSub>
            {folder.children!.map(child => 
              renderFolderNode(child, level + 1)
            )}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <div className="flex flex-col min-h-0 max-h-[60vh]">
        <SidebarMenu>
          {/* Dashboard/Root level */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                router.push('/dashboard');
                setOpenMobile(false);
              }}
              isActive={pathname === '/dashboard'}
              tooltip="Dashboard"
              className="hover:bg-amber-100/30 data-[active=true]:bg-amber-200/30"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Scrollable folder tree container */}
        <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 pr-1">
          <div className="min-w-max">
            <SidebarMenu>
              {folders.map(folder => renderFolderNode(folder))}
            </SidebarMenu>
          </div>
        </div>
      </div>
    </SidebarGroup>
  );
}