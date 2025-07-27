"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useFolderTree } from "@/contexts/folder-tree-context";
import { folderApi, ApiError } from "@/lib/api";
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
import { FolderPlus } from "lucide-react";
import { Folder } from "@/types/folder";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolderId?: string | null;
  parentFolderName?: string;
  onFolderCreated?: (newFolder: Folder) => void; // Callback to update folder data
}

export function FolderDialog({ 
  open, 
  onOpenChange, 
  parentFolderId = null, 
  parentFolderName = "Dashboard",
  onFolderCreated
}: FolderDialogProps) {
  const { getToken } = useAuth();
  const { addFolderToTree } = useFolderTree();
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError("");

    if (!folderName.trim()) {
      setFolderError("Folder name is required");
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

      // Create folder via centralized API
      const createdFolder = await folderApi.createFolder(token, {
        name: folderName,
        parent_id: parentFolderId
      });
      console.log("Folder created successfully:", createdFolder);
      
      // Add the new folder to the sidebar tree
      if (addFolderToTree.current) {
        addFolderToTree.current(createdFolder);
      }
      
      // Update folder data instantly (this now handles cache internally)
      if (onFolderCreated) {
        onFolderCreated(createdFolder);
      }
      
      // Reset form and close dialog
      setFolderName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
      if (error instanceof ApiError) {
        // Handle specific API errors with better messages
        setFolderError(error.message);
      } else {
        setFolderError(error instanceof Error ? error.message : "Failed to create folder. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    onOpenChange(false);
    setFolderName("");
    setFolderError("");
  };

  const contextText = parentFolderId 
    ? `Create a new folder inside "${parentFolderName}"`
    : "Create a new folder in your dashboard";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            {contextText}. You can organize your files by creating folders.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateFolder}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className={folderError ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {folderError && (
                <p className="text-sm text-red-600">{folderError}</p>
              )}
            </div>
            
            {/* Show context info */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              <strong>Location:</strong> {parentFolderName || "Dashboard"}
              {parentFolderId && (
                <>
                  <br />
                  <strong>Parent ID:</strong> {parentFolderId}
                </>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}