"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Upload,
  FileAudio,
  FileVideo,
  X,
  Settings,
  Play,
  ChevronLeft,
  Languages,
  Clock,
  Users,
  Link as LinkIcon,
  Globe
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import Link from "next/link";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: string;
}

export default function CreateTranscript() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // URL input state
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  
  // Transcription settings
  const [language, setLanguage] = useState("auto");
  const [quality, setQuality] = useState("balanced");
  const [speakerDetection, setSpeakerDetection] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');
      return isAudio || isVideo;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      duration: "Unknown", // Would be calculated from file metadata
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  }, []);

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
      // Check for common video/audio platforms
      const validDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'soundcloud.com', 'spotify.com', 'anchor.fm', 'buzzsprout.com'];
      const isValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain));
      
      if (!isValidDomain) {
        // Still allow other URLs, just warn
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

    // Create a URL-based file entry
    const urlFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file: new File([], "url-source", { type: "audio/url" }),
      name: urlInput.trim(),
      size: 0,
      type: "audio/url",
      duration: "Unknown",
    };

    setUploadedFiles(prev => [...prev, urlFile]);
    setUrlInput("");
    setUrlError("");
  };

  const handleStartTranscription = () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      
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
              <h1 className="text-2xl font-bold">Create New Transcript</h1>
              <p className="text-muted-foreground mt-1">
                Upload audio or video files to generate accurate transcriptions
              </p>
            </div>

            {/* File Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Drag and drop your audio or video files here, or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drop files here</h3>
                    <p className="text-muted-foreground mb-4">
                      Supports MP3, WAV, MP4, MOV, and other audio/video formats
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="audio/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* URL Input Section */}
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
                          placeholder="https://youtube.com/watch?v=... or any audio/video URL"
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
                      Supports YouTube, Vimeo, SoundCloud, Spotify, and other video/audio platforms
                    </p>
                  </div>
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

            {/* Transcription Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Transcription Settings
                </CardTitle>
                <CardDescription>
                  Configure how your files should be transcribed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality Settings */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Quality
                    </Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast (Lower accuracy)</SelectItem>
                        <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                        <SelectItem value="accurate">Accurate (Slower)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Speaker Detection */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Speaker Detection</p>
                      <p className="text-sm text-muted-foreground">
                        Identify and label different speakers in the transcript
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={speakerDetection ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpeakerDetection(!speakerDetection)}
                  >
                    {speakerDetection ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing & Results */}
            {(isProcessing || processingProgress > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Processing
                  </CardTitle>
                  <CardDescription>
                    Your files are being transcribed...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    {processingProgress >= 100 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">Transcription completed!</p>
                        <p className="text-green-600 text-sm mt-1">
                          Your transcript is ready for review and editing.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Link href="/dashboard">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              
              <Button 
                onClick={handleStartTranscription}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="min-w-[140px]"
              >
                {isProcessing ? (
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
    </SidebarProvider>
  );
}