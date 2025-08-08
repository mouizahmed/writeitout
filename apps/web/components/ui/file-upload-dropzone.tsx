"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { 
  Upload,
  FileAudio,
  FileVideo,
  X,
  Link as LinkIcon,
  Globe
} from "lucide-react";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: string;
}

interface FileUploadDropzoneProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  acceptedTypes?: {
    [key: string]: string[];
  };
  title?: string;
  description?: string;
  showUrlInput?: boolean;
  urlPlaceholder?: string;
  urlDescription?: string;
  className?: string;
}

export function FileUploadDropzone({
  uploadedFiles,
  onFilesChange,
  acceptedTypes = {
    'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma'],
    'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v']
  },
  title = "Upload Files",
  description = "Drag and drop your audio or video files here, or click to browse",
  showUrlInput = true,
  urlPlaceholder = "https://youtube.com/watch?v=... or any audio/video URL",
  urlDescription = "Supports YouTube, Vimeo, SoundCloud, Spotify, and other video/audio platforms",
  className
}: FileUploadDropzoneProps) {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileId = Math.random().toString(36).substr(2, 9);
      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        duration: 'Calculating...'
      };
    });
    
    onFilesChange([...uploadedFiles, ...newFiles]);
    
    // Get duration for audio/video files
    newFiles.forEach(fileObj => {
      if (fileObj.type.startsWith('audio/') || fileObj.type.startsWith('video/')) {
        const url = URL.createObjectURL(fileObj.file);
        const element = fileObj.type.startsWith('video/') 
          ? document.createElement('video')
          : document.createElement('audio');
        
        element.src = url;
        element.onloadedmetadata = () => {
          const duration = element.duration;
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          
          onFilesChange(prev => 
            prev.map(f => 
              f.id === fileObj.id 
                ? { ...f, duration: `${minutes}:${seconds.toString().padStart(2, '0')}` }
                : f
            )
          );
          
          URL.revokeObjectURL(url);
        };
      }
    });
  }, [uploadedFiles, onFilesChange]);

  const removeFile = useCallback((id: string) => {
    onFilesChange(uploadedFiles.filter(file => file.id !== id));
  }, [uploadedFiles, onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === 'audio/url') return Globe;
    return type.startsWith('video/') ? FileVideo : FileAudio;
  };

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const validDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'soundcloud.com', 'spotify.com', 'anchor.fm', 'buzzsprout.com'];
      const isValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));
      
      if (!isValidDomain) {
        return { isValid: true, warning: "URL may not be supported. We recommend YouTube, Vimeo, SoundCloud, or Spotify links." };
      }
      
      return { isValid: true };
    } catch {
      return { isValid: false, error: "Please enter a valid URL" };
    }
  };

  const handleAddUrl = () => {
    setUrlError("");
    
    if (!urlInput.trim()) {
      setUrlError("Please enter a URL");
      return;
    }

    const validation = validateUrl(urlInput.trim());
    
    if (!validation.isValid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    if (validation.warning) {
      setUrlError(validation.warning);
    }

    const urlFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file: new File([], "url-source", { type: "audio/url" }),
      name: urlInput.trim(),
      size: 0,
      type: "audio/url",
      duration: "Unknown",
    };

    onFilesChange([...uploadedFiles, urlFile]);
    setUrlInput("");
    setUrlError("");
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Upload Area */}
            <Dropzone
              onDrop={handleDrop}
              onError={console.error}
              accept={acceptedTypes}
              maxFiles={0}
              maxSize={undefined}
              multiple={true}
              src={uploadedFiles.length > 0 ? uploadedFiles.map(f => f.file) : undefined}
              className="cursor-pointer border-2 border-dashed rounded-lg text-center transition-colors"
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex size-12 items-center justify-center rounded-md text-muted-foreground">
                    <Upload size={24} />
                  </div>
                  <p className="text-lg font-medium">
                    Drop your files here
                  </p>
                  <p className="text-muted-foreground text-center mb-4">
                    or click to browse and select multiple files
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-4 h-4" />
                      <span>Audio files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4" />
                      <span>Video files</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Any size • Any number of files • MP3, MP4, WAV, MOV, and more
                  </p>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex size-12 items-center justify-center rounded-md text-muted-foreground mb-4">
                    <Upload size={24} />
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-muted-foreground text-center">
                    Drop more files to add them, or click to replace
                  </p>
                </div>
              </DropzoneContent>
            </Dropzone>

            {/* URL Input Section */}
            {showUrlInput && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="url-input" className="text-sm font-medium">
                      Add from URL
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="url-input"
                        type="url"
                        placeholder={urlPlaceholder}
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className={urlError && !urlError.includes("may not be supported") ? "border-red-500" : ""}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                      />
                      {urlError && (
                        <p className={`text-xs mt-1 ${
                          urlError.includes("may not be supported") 
                            ? "text-yellow-600" 
                            : "text-red-600"
                        }`}>
                          {urlError}
                        </p>
                      )}
                    </div>
                    <Button onClick={handleAddUrl} disabled={!urlInput.trim()}>
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {urlDescription}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Selected Files ({uploadedFiles.length})</h4>
              {uploadedFiles.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileIcon className="w-8 h-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {file.type === 'audio/url' ? (
                          <span>URL Source</span>
                        ) : (
                          <>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{file.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}