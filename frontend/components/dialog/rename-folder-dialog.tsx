"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { folderApi, ApiError } from "@/lib/api";
import { useFolderTree } from "@/contexts/folder-tree-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit3 } from "lucide-react";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  currentName: string;
  onFolderRenamed?: () => void; // Callback to refresh folder data
}

export function RenameFolderDialog({ 
  open, 
  onOpenChange, 
  folderId,
  currentName,
  onFolderRenamed
}: RenameFolderDialogProps) {
  const { getToken } = useAuth();
  const { updateFolderInTree } = useFolderTree();
  const [folderName, setFolderName] = useState(currentName);
  const [folderError, setFolderError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFolderName(currentName);
      setFolderError("");
    }
  }, [open, currentName]);

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError("");

    if (!folderName.trim()) {
      setFolderError("Folder name is required");
      return;
    }

    if (folderName.trim() === currentName.trim()) {
      setFolderError("Please enter a different name");
      return;
    }

    if (folderName.length > 255) {
      setFolderError("Folder name must be less than 255 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Get auth token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Rename folder via centralized API
      const updatedFolder = await folderApi.updateFolder(token, folderId, {
        name: folderName.trim()
      });
      console.log("Folder renamed successfully:", updatedFolder);
      
      // Update folder tree immediately with the response data
      if (updateFolderInTree.current) {
        updateFolderInTree.current(updatedFolder);
      }
      
      // Reset form and close dialog
      setFolderName("");
      onOpenChange(false);
      
      // Trigger refresh to update UI (for breadcrumbs and current folder data)
      if (onFolderRenamed) {
        onFolderRenamed();
      }
    } catch (error) {
      console.error("Failed to rename folder:", error);
      if (error instanceof ApiError) {
        // Handle specific API errors with better messages
        setFolderError(error.message);
      } else {
        setFolderError(error instanceof Error ? error.message : "Failed to rename folder. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    onOpenChange(false);
    setFolderName(currentName);
    setFolderError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter a new name for this folder. The folder name will be updated everywhere it appears.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRenameFolder}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter new folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className={folderError ? "border-red-500" : ""}
                disabled={isLoading}
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              {folderError && (
                <p className="text-sm text-red-600">{folderError}</p>
              )}
            </div>
            
            {/* Show current vs new name */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <div><strong>Current name:</strong> {currentName}</div>
              {folderName.trim() && folderName.trim() !== currentName && (
                <div><strong>New name:</strong> {folderName.trim()}</div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !folderName.trim() || folderName.trim() === currentName.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Renaming...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Rename Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}