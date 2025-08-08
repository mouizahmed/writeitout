"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FolderSelector } from "@/components/ui/folder-selector";
import { FileUploadDropzone, UploadedFile } from "@/components/ui/file-upload-dropzone";
import { TranscriptionSettings, TranscriptionConfig } from "@/components/ui/transcription-settings";
import { ProgressTracker, ProgressState } from "@/components/ui/progress-tracker";
import { ChevronLeft, Play } from "lucide-react";
import Link from "next/link";

export default function CreateTranscript() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Transcription settings
  const [transcriptionSettings, setTranscriptionSettings] = useState<TranscriptionConfig>({
    language: "auto",
    quality: "balanced",
    speakerDetection: false,
  });
  
  // Processing state
  const [progressState, setProgressState] = useState<ProgressState>({
    isProcessing: false,
    progress: 0,
    status: 'idle',
  });
  
  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>("Dashboard");

  // Redirect if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push('/login');
    return null;
  }

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleFolderChange = (folderId: string | null, folderName: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
  };
  
  const handleStartTranscription = () => {
    if (uploadedFiles.length === 0) return;
    
    console.log('Starting transcription with:', {
      files: uploadedFiles.length,
      folder: selectedFolderId,
      settings: transcriptionSettings
    });
    
    setProgressState({
      isProcessing: true,
      progress: 0,
      status: 'processing',
      message: 'Initializing transcription...'
    });
    
    // Simulate processing progress
    const interval = setInterval(() => {
      setProgressState(prev => {
        const newProgress = prev.progress + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            isProcessing: false,
            progress: 100,
            status: 'completed',
            message: 'Transcription completed successfully!'
          };
        }
        return {
          ...prev,
          progress: newProgress,
          message: `Processing files... ${Math.round(newProgress)}%`
        };
      });
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <SidebarTrigger className="shrink-0" />
            
            <div className="flex items-center gap-2 flex-1">
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-sm font-medium">Create Transcript</h1>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-medium">Create Transcript</h1>
              <p className="text-muted-foreground mt-1">
                Upload audio/video files or add URLs to generate accurate transcriptions
              </p>
            </div>

            {/* File Upload Area */}
            <FileUploadDropzone
              uploadedFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              title="Upload Files"
              description="Drag and drop your audio or video files here, or click to browse"
            />

            {/* Folder Selection */}
            <FolderSelector
              selectedFolderId={selectedFolderId}
              selectedFolderName={selectedFolderName}
              onFolderChange={handleFolderChange}
              title="Destination Folder"
              description="Choose where to save your transcripts"
            />

            {/* Transcription Settings */}
            <TranscriptionSettings
              settings={transcriptionSettings}
              onSettingsChange={setTranscriptionSettings}
            />

            {/* Processing & Results */}
            <ProgressTracker
              progressState={progressState}
              title="Processing"
              description="Your files are being transcribed..."
              successMessage="Transcription completed!"
              successDescription="Your transcript is ready for review and editing."
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Link href="/dashboard">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              
              <Button 
                onClick={handleStartTranscription}
                disabled={uploadedFiles.length === 0 || progressState.isProcessing}
                className="min-w-[140px]"
              >
                {progressState.isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Transcription
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
  );
}