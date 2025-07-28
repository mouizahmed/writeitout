"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Folder, FileText } from "lucide-react";
import { folderApi } from "@/lib/api";
import { FileItem } from "@/types/folder";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: FileItem[];
  onItemsDeleted: (deletedItemIds: string[]) => void;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedItems,
  onItemsDeleted,
}: BulkDeleteDialogProps) {
  const { getToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionErrors, setDeletionErrors] = useState<string[]>([]);

  const folderCount = selectedItems.filter(item => item.type === 'folder').length;
  const fileCount = selectedItems.filter(item => item.type !== 'folder').length;
  const totalCount = selectedItems.length;

  const getItemIcon = (type: string) => {
    if (type === 'folder') {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getCountText = () => {
    if (folderCount > 0 && fileCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''} and ${fileCount} file${fileCount !== 1 ? 's' : ''}`;
    } else if (folderCount > 0) {
      return `${folderCount} folder${folderCount !== 1 ? 's' : ''}`;
    } else {
      return `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeletionErrors([]);
    
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required');

      const deletedIds: string[] = [];
      const errors: string[] = [];

      // Delete folders (only folders are supported for now)
      for (const item of selectedItems) {
        if (item.type === 'folder') {
          try {
            await folderApi.deleteFolder(token, item.id);
            deletedIds.push(item.id);
          } catch (error) {
            console.error(`Failed to delete folder ${item.name}:`, error);
            errors.push(`Failed to delete folder "${item.name}"`);
          }
        } else {
          // For now, skip non-folder items since we don't have file deletion API
          errors.push(`Cannot delete file "${item.name}" - not supported yet`);
        }
      }

      setDeletionErrors(errors);

      if (deletedIds.length > 0) {
        onItemsDeleted(deletedIds);
      }

      // Close dialog if all items were deleted successfully
      if (errors.length === 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      setDeletionErrors(['Failed to delete items. Please try again.']);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-left">Delete {totalCount} Items</DialogTitle>
              <DialogDescription className="text-left mt-1">
                Are you sure you want to delete {getCountText()}? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-3 rounded-md border max-h-40 overflow-y-auto">
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {getItemIcon(item.type)}
                  <span className="text-gray-900">{item.name}</span>
                  {item.type !== 'folder' && (
                    <span className="text-red-500 text-xs">(not supported)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {deletionErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">Some items could not be deleted:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                {deletionErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {deletionErrors.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || selectedItems.filter(item => item.type === 'folder').length === 0}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${folderCount > 0 ? folderCount : totalCount} Item${(folderCount > 0 ? folderCount : totalCount) !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}