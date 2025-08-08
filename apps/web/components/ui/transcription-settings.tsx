"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings,
  Languages,
  Clock,
  Users
} from "lucide-react";

export interface TranscriptionConfig {
  language: string;
  quality: string;
  speakerDetection: boolean;
}

interface TranscriptionSettingsProps {
  settings: TranscriptionConfig;
  onSettingsChange: (settings: TranscriptionConfig) => void;
  title?: string;
  description?: string;
  showLanguageSelection?: boolean;
  showQualitySelection?: boolean;
  showSpeakerDetection?: boolean;
  languageOptions?: Array<{ value: string; label: string }>;
  qualityOptions?: Array<{ value: string; label: string; description?: string }>;
  className?: string;
}

const DEFAULT_LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const DEFAULT_QUALITY_OPTIONS = [
  { value: "fast", label: "Fast", description: "Lower accuracy" },
  { value: "balanced", label: "Balanced", description: "Recommended" },
  { value: "accurate", label: "Accurate", description: "Slower" },
];

export function TranscriptionSettings({
  settings,
  onSettingsChange,
  title = "Transcription Settings",
  description = "Configure how your files should be transcribed",
  showLanguageSelection = true,
  showQualitySelection = true,
  showSpeakerDetection = true,
  languageOptions = DEFAULT_LANGUAGE_OPTIONS,
  qualityOptions = DEFAULT_QUALITY_OPTIONS,
  className
}: TranscriptionSettingsProps) {
  
  const updateSetting = <K extends keyof TranscriptionConfig>(
    key: K,
    value: TranscriptionConfig[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Selection */}
            {showLanguageSelection && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Language
                </Label>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quality Settings */}
            {showQualitySelection && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Quality
                </Label>
                <Select 
                  value={settings.quality} 
                  onValueChange={(value) => updateSetting('quality', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">
                              ({option.description})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Speaker Detection */}
          {showSpeakerDetection && (
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
                variant={settings.speakerDetection ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('speakerDetection', !settings.speakerDetection)}
              >
                {settings.speakerDetection ? "Enabled" : "Disabled"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}