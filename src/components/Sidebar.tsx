import React from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Download, Trash2, Play, Pause, SkipBack, SkipForward, Circle, Square } from "lucide-react";
import { HalftoneControls, HalftoneSettings } from "./HalftoneControls";

interface VideoControlsProps {
  isPlaying: boolean;
  videoProgress: number;
  videoDuration: number;
  playbackSpeed: number[];
  isRecording: boolean;
  togglePlayPause: () => void;
  skipBackward: () => void;
  skipForward: () => void;
  handleSeek: (value: number[]) => void;
  handleSpeedChange: (value: number[]) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

interface SidebarProps {
  settings: HalftoneSettings;
  imageFile: File | null;
  isVideo?: boolean;
  previewVideoUrl?: string | null;
  onReset: () => void;
  onDownload: () => void;
  videoControls?: VideoControlsProps;
}

// Format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function Sidebar({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  onReset,
  onDownload,
  videoControls,
}: SidebarProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Title section */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold uppercase text-center">Halftone Controls</h2>
      </div>

      {/* Video Controls - only visible for videos */}
      {isVideo && videoControls && (
        <div className="p-4 border-b border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={videoControls.skipBackward}
                title="Skip backward 5s"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={videoControls.togglePlayPause}
                title={videoControls.isPlaying ? "Pause" : "Play"}
              >
                {videoControls.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={videoControls.skipForward}
                title="Skip forward 5s"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(videoControls.videoProgress)}</span>
                <span>{formatTime(videoControls.videoDuration)}</span>
              </div>
              <Slider
                value={[videoControls.videoProgress]}
                onValueChange={videoControls.handleSeek}
                max={videoControls.videoDuration || 100}
                step={0.1}
                className="cursor-pointer"
                disabled={!videoControls.videoDuration}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Playback Speed: {videoControls.playbackSpeed[0].toFixed(1)}x
              </Label>
              <Slider
                value={videoControls.playbackSpeed}
                onValueChange={videoControls.handleSpeedChange}
                min={0.25}
                max={2}
                step={0.25}
                className="cursor-pointer"
              />
            </div>

            {/* Recording controls */}
            <div className="pt-2 space-y-2">
              <Button
                variant={videoControls.isRecording ? "destructive" : "default"}
                onClick={
                  videoControls.isRecording
                    ? videoControls.stopRecording
                    : videoControls.startRecording
                }
                className="w-full"
              >
                {videoControls.isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Record Video
                  </>
                )}
              </Button>
              {videoControls.isRecording ? (
                <p className="text-xs text-center text-muted-foreground">
                  🔴 Recording at 60fps, 25Mbps...
                </p>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  Saves as WebM. Convert to MP4 using{" "}
                  <a
                    href="https://cloudconvert.com/webm-to-mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    CloudConvert
                  </a>{" "}
                  or FFmpeg.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable accordion controls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <HalftoneControls
          settings={settings}
          imageFile={imageFile}
          isVideo={isVideo}
          previewVideoUrl={previewVideoUrl}
        />
      </div>

      {/* Reset and Download buttons */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="outline" onClick={onReset} className="w-full cursor-pointer">
          <Trash2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={onDownload}
          className="w-full bg-black text-white hover:bg-black/90 hover:scale-105 active:scale-95 transition-all duration-150 border-0 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          {isVideo ? "Download Current Frame" : "Download Image"}
        </Button>
      </div>
    </div>
  );
}

