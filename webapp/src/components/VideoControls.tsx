import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Play, Pause, SkipBack, SkipForward, Circle, Square } from "lucide-react";

export interface VideoControlsProps {
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

// Format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface Props {
  controls: VideoControlsProps;
  compact?: boolean;
}

export function VideoControls({ controls, compact = false }: Props) {
  const {
    isPlaying,
    videoProgress,
    videoDuration,
    playbackSpeed,
    isRecording,
    togglePlayPause,
    skipBackward,
    skipForward,
    handleSeek,
    handleSpeedChange,
    startRecording,
    stopRecording,
  } = controls;

  return (
    <div className="p-4 border-b border-border">
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={skipBackward}
            title="Skip backward 5s"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={skipForward}
            title="Skip forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(videoProgress)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
          <Slider
            value={[videoProgress]}
            onValueChange={handleSeek}
            max={videoDuration || 100}
            step={0.1}
            className="cursor-pointer"
            disabled={!videoDuration}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Playback Speed: {playbackSpeed[0].toFixed(1)}x</Label>
          <Slider
            value={playbackSpeed}
            onValueChange={handleSpeedChange}
            min={0.25}
            max={2}
            step={0.25}
            className="cursor-pointer"
          />
        </div>

        {/* Recording controls */}
        <div className="pt-2 space-y-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className="w-full"
          >
            {isRecording ? (
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
          {isRecording ? (
            <p className="text-xs text-center text-muted-foreground">
              🔴 Recording in progress...
            </p>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Records as MP4 (or WebM on Firefox).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

