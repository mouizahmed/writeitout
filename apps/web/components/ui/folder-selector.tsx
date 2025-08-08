"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderTreeSelector } from "@/components/ui/folder-tree-selector";
import { FolderDialog } from "@/components/dialog/create-folder-dialog";
import { folderApi } from "@/lib/api";
import { Folder } from "@/types/folder";
import { FolderIcon, Plus, FolderOpen } from "lucide-react";

interface FolderSelectorProps {
  selectedFolderId: string | null;
  selectedFolderName: string;
  onFolderChange: (folderId: string | null, folderName: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function FolderSelector({
  selectedFolderId,
  selectedFolderName,
  onFolderChange,
  title = "Destination Folder",
  description = "Choose where to save your items",
  className
}: FolderSelectorProps) {
  const { getToken } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // Load folders on component mount
  useEffect(() => {
    const loadFolders = async () => {
      setFoldersLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const response = await folderApi.getAllFolders(token);
          setFolders(response.folders || []);
        }
      } catch (error) {
        console.error('Failed to load folders:', error);
      } finally {
        setFoldersLoading(false);
      }
    };
    
    loadFolders();
  }, [getToken]);

  const handleFolderSelect = (folderId: string | null) => {
    const folder = folders.find(f => f.id === folderId);
    const folderName = folder?.name || "Dashboard";
    onFolderChange(folderId, folderName);
    setShowFolderSelector(false);
  };
  
  const handleFolderCreated = (newFolder: Folder) => {
    setFolders(prev => [...prev, newFolder]);
    onFolderChange(newFolder.id, newFolder.name);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedFolderName}</span>
              </div>
            </div>
            <Dialog open={showFolderSelector} onOpenChange={setShowFolderSelector}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Select Destination Folder</DialogTitle>
                  <DialogDescription>
                    Choose which folder to save your items in
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {foldersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <FolderTreeSelector
                      folders={folders}
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={handleFolderSelect}
                    />
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateFolder(true)}
                    className="mr-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                  <Button variant="outline" onClick={() => setShowFolderSelector(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Create Folder Dialog */}
      <FolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        parentFolderId={selectedFolderId}
        parentFolderName={selectedFolderName}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  );
}