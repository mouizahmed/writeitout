"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  FolderPlus, 
  Upload,
  X,
  Download,
  Move,
  ChevronDown,
  FileAudio,
  Home,
  Trash
} from "lucide-react";
import { FilesTable, FilesTableRef, type FileItem } from "@/components/files-table";
import type { Folder } from "@/types/folder";
import { FolderDialog } from "@/components/dialog/create-folder-dialog";
import { RenameFolderDialog } from "@/components/dialog/rename-folder-dialog";
import { DeleteFolderDialog } from "@/components/dialog/delete-folder-dialog";
import { BulkDeleteDialog } from "@/components/dialog/bulk-delete-dialog";
import { MoveFolderDialog } from "@/components/dialog/move-folder-dialog";
import { useFolderData } from "@/hooks/use-folder-data";
import Link from "next/link";

interface DashboardLayoutProps {
  currentFolderId?: string | null;
  showBreadcrumbs?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  parentFolderName?: string;
}

export function DashboardLayout({
  currentFolderId,
  showBreadcrumbs = false,
  emptyStateTitle = "No files yet",
  emptyStateDescription = "Get started by uploading your first file for transcription",
  parentFolderName = "Dashboard"
}: DashboardLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { folder, breadcrumbs, files, loading, error, refetch, updateFolder, addFolder, deleteFolder, moveFolder } = useFolderData(currentFolderId ?? null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [isRenameChildFolderOpen, setIsRenameChildFolderOpen] = useState(false);
  const [selectedFolderForRename, setSelectedFolderForRename] = useState<{id: string, name: string} | null>(null);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [selectedFolderForDelete, setSelectedFolderForDelete] = useState<{id: string, name: string} | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedItemsForDelete, setSelectedItemsForDelete] = useState<FileItem[]>([]);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedItemsForMove, setSelectedItemsForMove] = useState<FileItem[]>([]);
  const filesTableRef = useRef<FilesTableRef>(null);

  const handleFileSelection = useCallback((selectedFiles: FileItem[]) => {
    setSelectedFiles(selectedFiles.map(file => file.id));
    setSelectedItemsForDelete(selectedFiles);
    setSelectedItemsForMove(selectedFiles);
  }, []);

  const handleClearSelection = useCallback(() => {
    filesTableRef.current?.clearSelection();
    setSelectedItemsForDelete([]);
    setSelectedItemsForMove([]);
  }, []);

  const handleFolderClick = useCallback((folderId: string) => {
    router.push(`/dashboard/folder/${folderId}`);
  }, [router]);

  const handleFolderRename = useCallback((folderId: string, currentName: string) => {
    setSelectedFolderForRename({ id: folderId, name: currentName });
    if (showBreadcrumbs) {
      setIsRenameChildFolderOpen(true);
    } else {
      setIsRenameFolderOpen(true);
    }
  }, [showBreadcrumbs]);

  const handleFolderDelete = useCallback((folderId: string, folderName: string) => {
    setSelectedFolderForDelete({ id: folderId, name: folderName });
    setIsDeleteFolderOpen(true);
  }, []);

  const handleSingleFolderMove = useCallback((folderId: string, folderName: string) => {
    const folderItem: FileItem = {
      id: folderId,
      name: folderName,
      type: 'folder',
      created_at: new Date().toISOString(),
      folder_id: currentFolderId || undefined,
    };
    setSelectedItemsForMove([folderItem]);
    setIsMoveDialogOpen(true);
  }, [currentFolderId]);

  const handleBulkDelete = useCallback(() => {
    if (selectedItemsForDelete.length > 0) {
      setIsBulkDeleteOpen(true);
    }
  }, [selectedItemsForDelete]);

  const handleBulkDeleteCompleted = useCallback((deletedItemIds: string[]) => {
    // Remove deleted items from cache and update UI
    deletedItemIds.forEach(itemId => {
      const deletedItem = selectedItemsForDelete.find(item => item.id === itemId);
      if (deletedItem && deletedItem.type === 'folder') {
        deleteFolder(itemId);
      }
    });
    
    // Clear selection after successful deletion
    filesTableRef.current?.clearSelection();
    setSelectedItemsForDelete([]);
    setSelectedFiles([]);
  }, [selectedItemsForDelete, deleteFolder]);

  const handleBulkMove = useCallback(() => {
    // Only show move dialog if all selected items are folders
    const folderItems = selectedItemsForMove.filter(item => item.type === 'folder');
    if (folderItems.length > 0 && folderItems.length === selectedItemsForMove.length) {
      setIsMoveDialogOpen(true);
    }
  }, [selectedItemsForMove]);

  const handleMoveFoldersCompleted = useCallback((movedFolders: { folderId: string; oldParentId: string | null; newParentId: string | null; updatedFolder: Folder }[]) => {
    // Update cache for moved folders
    movedFolders.forEach(({ folderId, oldParentId, newParentId, updatedFolder }) => {
      moveFolder(folderId, oldParentId, newParentId, updatedFolder);
    });
    
    // Clear selection after successful move
    filesTableRef.current?.clearSelection();
    setSelectedItemsForMove([]);
    setSelectedFiles([]);
  }, [moveFolder]);

  // Check if all selected items are folders (for Move button)
  const allSelectedAreFolders = selectedItemsForMove.length > 0 && 
    selectedItemsForMove.every(item => item.type === 'folder');

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (isLoaded && !isSignedIn) {
    return null;
  }

  // Show loading state for data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state for data (only for actual errors, not empty folders)
  if (error && !error.includes('no rows')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading: {error}</p>
          <button onClick={refetch} className="text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
            {/* Breadcrumb Navigation */}
            {showBreadcrumbs && (
              <div className="flex items-center gap-2 min-w-0">
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    {index > 0 && <span className="text-muted-foreground">/</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <button 
                        onClick={() => setIsRenameFolderOpen(true)}
                        className="text-sm font-medium truncate hover:underline cursor-pointer"
                        disabled={!folder}
                      >
                        {breadcrumb.name}
                      </button>
                    ) : (
                      <Link 
                        href={breadcrumb.href} 
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm"
                      >
                        {index === 0 && <Home className="w-4 h-4" />}
                        <span className={index === 0 ? "hidden sm:inline" : ""}>{breadcrumb.name}</span>
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex-1 min-w-0 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full text-sm"
                  />
                </div>
              </div>
              
              {selectedFiles.length > 0 ? (
                <>
                  {/* Selection actions - Desktop */}
                  <div className="hidden sm:flex items-center space-x-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={handleClearSelection}>
                      <X className="w-4 h-4 mr-1" />
                      All selected
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkMove}
                      disabled={!allSelectedAreFolders}
                    >
                      <Move className="w-4 h-4 mr-1" />
                      Move
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  
                  {/* Selection actions - Mobile */}
                  <div className="flex sm:hidden items-center space-x-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={handleClearSelection}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkMove}
                      disabled={!allSelectedAreFolders}
                    >
                      <Move className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Default create actions - Desktop */}
                  <div className="hidden sm:flex items-center space-x-2 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Create
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/create" className="flex items-center">
                            <FileAudio className="w-4 h-4 mr-2" />
                            New Transcript
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <button className="flex items-center w-full" onClick={() => setIsCreateFolderOpen(true)}>
                            <FolderPlus className="w-4 h-4 mr-2" />
                            New Folder
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Default create actions - Mobile */}
                  <div className="flex sm:hidden items-center space-x-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/create" className="flex items-center">
                            <FileAudio className="w-4 h-4 mr-2" />
                            New Transcript
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <button className="flex items-center w-full" onClick={() => setIsCreateFolderOpen(true)}>
                            <FolderPlus className="w-4 h-4 mr-2" />
                            New Folder
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {files.length > 0 ? (
          <div className="flex-1 overflow-x-auto" style={{ clipPath: 'none' }}>
            <div className="h-full p-4 pb-20 relative">
              <FilesTable 
                ref={filesTableRef}
                data={files} 
                onSelectionChange={handleFileSelection}
                onFolderClick={handleFolderClick}
                onFolderRename={handleFolderRename}
                onFolderDelete={handleFolderDelete}
                onFolderMove={handleSingleFolderMove}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{emptyStateTitle}</h3>
              <p className="text-muted-foreground mb-4">
                {emptyStateDescription}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/create" className="flex items-center">
                      <FileAudio className="w-4 h-4 mr-2" />
                      New Transcript
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button className="flex items-center w-full" onClick={() => setIsCreateFolderOpen(true)}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      New Folder
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </main>
      
      {/* Folder Creation Dialog */}
      <FolderDialog 
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        parentFolderId={currentFolderId}
        parentFolderName={folder?.name || parentFolderName}
        onFolderCreated={addFolder}
      />
      
      {/* Folder Rename Dialog - Current Folder (Breadcrumb) */}
      {showBreadcrumbs && folder && (
        <RenameFolderDialog 
          open={isRenameFolderOpen}
          onOpenChange={setIsRenameFolderOpen}
          folderId={folder.id}
          currentName={folder.name}
          onFolderRenamed={updateFolder}
        />
      )}

      {/* Child Folder Rename Dialog - From Table Actions */}
      {selectedFolderForRename && (
        <RenameFolderDialog 
          open={showBreadcrumbs ? isRenameChildFolderOpen : isRenameFolderOpen}
          onOpenChange={showBreadcrumbs ? setIsRenameChildFolderOpen : setIsRenameFolderOpen}
          folderId={selectedFolderForRename.id}
          currentName={selectedFolderForRename.name}
          onFolderRenamed={updateFolder}
        />
      )}

      {/* Delete Folder Dialog */}
      {selectedFolderForDelete && (
        <DeleteFolderDialog 
          open={isDeleteFolderOpen}
          onOpenChange={setIsDeleteFolderOpen}
          folderId={selectedFolderForDelete.id}
          folderName={selectedFolderForDelete.name}
          onFolderDeleted={deleteFolder}
        />
      )}

      {/* Bulk Delete Dialog */}
      <BulkDeleteDialog 
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        selectedItems={selectedItemsForDelete}
        onItemsDeleted={handleBulkDeleteCompleted}
      />

      {/* Move Folder Dialog */}
      <MoveFolderDialog 
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        selectedFolders={selectedItemsForMove}
        onFoldersMovedCompleted={handleMoveFoldersCompleted}
      />
    </div>
  );
}