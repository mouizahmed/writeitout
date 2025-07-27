"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Settings
} from "lucide-react";

interface AudioPlayerProps {
  videoUrl: string;
  duration: number;
  onTimeUpdate: (time: number) => void;
  seekTime?: number;
  isMiniplayer?: boolean;
}

export function AudioPlayer({ videoUrl, duration, onTimeUpdate, seekTime, isMiniplayer = false }: AudioPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle seeking from external sources (transcript clicks)
  useEffect(() => {
    if (seekTime !== undefined && videoRef.current && Math.abs(seekTime - currentTime) > 1) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime, currentTime]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate(time);
  }, [onTimeUpdate]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate(newTime);
  }, [onTimeUpdate]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const skipBackward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  }, [duration]);

  const changePlaybackRate = useCallback(() => {
    if (!videoRef.current) return;
    
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  }, [playbackRate]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    if (videoRef.current) {
      setCurrentTime(0);
    }
  }, []);

  const handleError = useCallback(() => {
    setError("Failed to load video. Please check the file path.");
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  if (isMiniplayer) {
    return (
      <div className="flex flex-col h-full bg-black">
        {/* Video Display */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-red-400 text-xs">Error loading video</p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            preload="metadata"
          />

          {/* Mini Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 space-y-1">
            {/* Progress Bar */}
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            
            {/* Mini Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  disabled={isLoading || !!error}
                  className="text-white hover:bg-gray-800 h-6 w-6 p-0"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-gray-800 h-6 w-6 p-0"
                >
                  {isMuted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
              
              <span className="text-xs text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video Display */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-red-400 mb-2">Error loading video</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onPlay={handlePlay}
          onPause={handlePause}
          preload="metadata"
        />

        {/* Click to Play Overlay */}
        {!isPlaying && !isLoading && !error && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
            onClick={togglePlay}
          >
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-700 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 text-white text-sm">
          <span className="text-xs text-gray-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <span className="text-xs text-gray-400 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Main Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="text-white hover:bg-gray-800"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              disabled={isLoading || !!error}
              className="text-white hover:bg-gray-800"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="text-white hover:bg-gray-800"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-gray-800"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-20">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={changePlaybackRate}
              className="text-white hover:bg-gray-800 text-xs"
            >
              {playbackRate}x
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}