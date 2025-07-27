"use client";

import { useState, useCallback, useEffect } from "react";
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
  MoreHorizontal,
  ChevronDown,
  FileAudio
} from "lucide-react";
import { FilesTable, type FileItem } from "@/components/files-table";
import { FolderDialog } from "@/components/dialog/create-folder-dialog";
import { useFolderContext } from "@/hooks/use-folder-context";
import { useFolderData } from "@/hooks/use-folder-data";
import Link from "next/link";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { currentFolderId } = useFolderContext();
  const { files, loading, error, refetch, addFolder } = useFolderData(currentFolderId); // null for root folder
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const handleFileSelection = useCallback((selectedFiles: FileItem[]) => {
    setSelectedFiles(selectedFiles.map(file => file.id));
  }, []);

  const handleFolderClick = useCallback((folderId: string) => {
    router.push(`/dashboard/folder/${folderId}`);
  }, [router]);



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

  // Show loading state for data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state for data (only for actual errors, not empty data)
  if (error && !error.includes('no rows')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
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
          </header>

          {/* Main content area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {files.length > 0 ? (
              <div className="flex-1 overflow-x-auto" style={{ clipPath: 'none' }}>
                <div className="h-full p-4 pb-20 relative">
                  <FilesTable 
                    data={files} 
                    onSelectionChange={handleFileSelection}
                    onFolderClick={handleFolderClick}
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
        
        {/* Folder Creation Dialog */}
        <FolderDialog 
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          parentFolderId={currentFolderId}
          parentFolderName="Dashboard"
          onFolderCreated={addFolder}
        />
      </div>
  );
}