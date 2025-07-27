"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Download, 
  Copy,
  Edit3,
  User,
  Clock,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  speaker: string;
  text: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  activeSegmentId: string | null;
  onSegmentClick: (time: number) => void;
}

export function TranscriptViewer({ segments, activeSegmentId, onSegmentClick }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [activeSegmentId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    const colors = {
      "Interviewer": "text-blue-600",
      "Elon Musk": "text-purple-600"
    };
    return colors[speaker as keyof typeof colors] || "text-gray-600";
  };

  const getSpeakerBadgeColor = (speaker: string) => {
    const colors = {
      "Interviewer": "bg-blue-100 text-blue-800",
      "Elon Musk": "bg-purple-100 text-purple-800"
    };
    return colors[speaker as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredSegments = segments.filter(segment => 
    searchQuery === "" || 
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditSegment = (segment: TranscriptSegment) => {
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };

  const handleSaveEdit = () => {
    // In a real app, this would save to backend
    console.log("Saving edit:", { segmentId: editingSegment, newText: editText });
    setEditingSegment(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
    setEditText("");
  };

  const handleCopyTranscript = () => {
    const fullTranscript = segments
      .map(segment => `${segment.speaker}: ${segment.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullTranscript);
  };

  const handleDownloadTranscript = () => {
    const fullTranscript = segments
      .map(segment => `[${formatTime(segment.start)}] ${segment.speaker}: ${segment.text}`)
      .join('\n\n');
    
    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transcript</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{new Set(segments.map(s => s.speaker)).size} speakers</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{segments.length} segments</span>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {filteredSegments.map((segment) => {
            const isActive = segment.id === activeSegmentId;
            const isEditing = editingSegment === segment.id;

            return (
              <div
                key={segment.id}
                ref={isActive ? activeSegmentRef : undefined}
                className={`group relative p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                  isActive 
                    ? 'bg-amber-50 border-amber-200 shadow-sm' 
                    : 'border-border hover:border-muted-foreground/20'
                }`}
                onClick={() => onSegmentClick(segment.start)}
              >
                {/* Time and Speaker Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground font-mono bg-muted px-2 py-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSegmentClick(segment.start);
                      }}
                    >
                      {formatTime(segment.start)}
                    </button>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSpeakerBadgeColor(segment.speaker)}`}>
                      {segment.speaker}
                    </span>
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSegment(segment);
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>

                {/* Transcript Text */}
                {isEditing ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 border rounded-md resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm leading-relaxed ${getSpeakerColor(segment.speaker)}`}>
                    {segment.text}
                  </p>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r-full" />
                )}
              </div>
            );
          })}

          {filteredSegments.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {searchQuery ? `${filteredSegments.length} of ${segments.length} segments` : `${segments.length} segments total`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs">
              <ChevronUp className="w-3 h-3 mr-1" />
              Previous
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <ChevronDown className="w-3 h-3 mr-1" />
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}