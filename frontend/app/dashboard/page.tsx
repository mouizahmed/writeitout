"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  FolderPlus, 
  Upload,
  X,
  Download,
  Move,
  MoreHorizontal
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { FilesTable, type FileItem } from "@/components/files-table";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");

  const handleFileSelection = useCallback((selectedFiles: FileItem[]) => {
    setSelectedFiles(selectedFiles.map(file => file.id));
  }, []);

  // Handle folder creation
  const handleCreateFolder = (e: React.FormEvent) => {
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

    // TODO: API call to create folder
    console.log("Creating folder:", folderName);
    
    // Reset form and close dialog
    setFolderName("");
    setIsCreateFolderOpen(false);
  };

  const handleCloseDialog = () => {
    setIsCreateFolderOpen(false);
    setFolderName("");
    setFolderError("");
  };


  // Redirect if not authenticated (using useEffect to avoid render-time side effects)
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

  // Don't render anything if not authenticated (prevents API spam)
  if (isLoaded && !isSignedIn) {
    return null;
  }

  // Mock data for files
  const files: FileItem[] = [
    {
      id: "1",
      name: "jhh",
      type: "folder",
      created: "17 Jul 2025",
    },
    {
      id: "2",
      name: "Meetings",
      type: "folder",
      created: "19 Jun 2025",
    },
    {
      id: "3",
      name: "[sub] content_warning_3790b5e2.webm",
      type: "video",
      created: "19 Jun 2025",
      length: "1:30",
      language: "EN",
      service: "Automatic",
      tags: []
    },
    {
      id: "4",
      name: "content_warning_3790b5e2.webm",
      type: "video", 
      created: "18 Jun 2025",
      length: "1:30",
      language: "EN",
      service: "Automatic",
      tags: ["Add tags"]
    }
  ];

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
              <SidebarTrigger className="shrink-0" />
              
              <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
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
                      <Button variant="outline" size="sm">
                        <X className="w-4 h-4 mr-1" />
                        All selected
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Move className="w-4 h-4 mr-1" />
                        Move
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Selection actions - Mobile */}
                    <div className="flex sm:hidden items-center space-x-1 shrink-0">
                      <Button variant="outline" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Move className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Default create actions - Desktop */}
                    <div className="hidden sm:flex items-center space-x-2 shrink-0">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Create
                      </Button>
                      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FolderPlus className="w-4 h-4 mr-1" />
                            Folder
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                            <DialogDescription>
                              Enter a name for your new folder. You can organize your files by creating folders.
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
                                />
                                {folderError && (
                                  <p className="text-sm text-red-600">{folderError}</p>
                                )}
                              </div>
                            </div>
                            <DialogFooter className="mt-6">
                              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancel
                              </Button>
                              <Button type="submit">
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Create Folder
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {/* Default create actions - Mobile */}
                    <div className="flex sm:hidden items-center space-x-1 shrink-0">
                      <Button size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FolderPlus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {files.length > 0 ? (
              <div className="flex-1 overflow-x-auto" style={{ clipPath: 'none' }}>
                <div className="h-full p-4 pb-20 relative">
                  <FilesTable 
                    data={files} 
                    onSelectionChange={handleFileSelection}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No files yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by uploading your first file for transcription
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload file
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
    </SidebarProvider>
  );
}