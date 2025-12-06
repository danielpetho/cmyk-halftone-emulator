import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Info, Play, Pause, SkipBack, SkipForward, Circle, Square } from "lucide-react";
import { Knob } from "./ui/knob";
import { ColorPicker } from "./ui/color-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { VideoControlsProps } from "./VideoControls";

export interface HalftoneSettings {
  // General settings
  frequency: number[];
  setFrequency: (v: number[]) => void;
  dotSize: number[];
  setDotSize: (v: number[]) => void;
  roughness: number[];
  setRoughness: (v: number[]) => void;
  fuzz: number[];
  setFuzz: (v: number[]) => void;
  paperNoise: number[];
  setPaperNoise: (v: number[]) => void;
  inkNoise: number[];
  setInkNoise: (v: number[]) => void;
  randomness: number[];
  setRandomness: (v: number[]) => void;
  contrast: number[];
  setContrast: (v: number[]) => void;
  blur: number[];
  setBlur: (v: number[]) => void;
  threshold: number[];
  setThreshold: (v: number[]) => void;
  blendMode: number;
  setBlendMode: (v: number) => void;

  // Screen angles
  cyanAngle: number[];
  setCyanAngle: (v: number[]) => void;
  magentaAngle: number[];
  setMagentaAngle: (v: number[]) => void;
  yellowAngle: number[];
  setYellowAngle: (v: number[]) => void;
  blackAngle: number[];
  setBlackAngle: (v: number[]) => void;

  // Ink colors
  cyanInk: string;
  setCyanInk: (v: string) => void;
  magentaInk: string;
  setMagentaInk: (v: string) => void;
  yellowInk: string;
  setYellowInk: (v: string) => void;
  blackInk: string;
  setBlackInk: (v: string) => void;
  paperColor: string;
  setPaperColor: (v: string) => void;

  // Layer visibility
  showCyan: boolean;
  setShowCyan: (v: boolean) => void;
  showMagenta: boolean;
  setShowMagenta: (v: boolean) => void;
  showYellow: boolean;
  setShowYellow: (v: boolean) => void;
  showBlack: boolean;
  setShowBlack: (v: boolean) => void;
}

// Format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface HalftoneControlsProps {
  settings: HalftoneSettings;
  imageFile: File | null;
  isVideo?: boolean;
  previewVideoUrl?: string | null;
  showOriginalMedia?: boolean;
  videoControls?: VideoControlsProps;
}

export function HalftoneControls({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  showOriginalMedia = true,
  videoControls,
}: HalftoneControlsProps) {
  const {
    frequency,
    setFrequency,
    dotSize,
    setDotSize,
    roughness,
    setRoughness,
    fuzz,
    setFuzz,
    paperNoise,
    setPaperNoise,
    inkNoise,
    setInkNoise,
    randomness,
    setRandomness,
    contrast,
    setContrast,
    blur,
    setBlur,
    threshold,
    setThreshold,
    blendMode,
    setBlendMode,
    cyanAngle,
    setCyanAngle,
    magentaAngle,
    setMagentaAngle,
    yellowAngle,
    setYellowAngle,
    blackAngle,
    setBlackAngle,
    cyanInk,
    setCyanInk,
    magentaInk,
    setMagentaInk,
    yellowInk,
    setYellowInk,
    blackInk,
    setBlackInk,
    paperColor,
    setPaperColor,
    showCyan,
    setShowCyan,
    showMagenta,
    setShowMagenta,
    showYellow,
    setShowYellow,
    showBlack,
    setShowBlack,
  } = settings;

  // Build default open accordions based on what's available
  const defaultOpenSections = [
    "halftone-settings",
    "ink-colors",
  ];
  if (isVideo && videoControls) {
    defaultOpenSections.unshift("video-controls");
  }

  return (
    <TooltipProvider>
      <Accordion type="multiple" defaultValue={defaultOpenSections}>
        {/* Video Controls - only visible for videos */}
        {isVideo && videoControls && (
          <AccordionItem value="video-controls" className="px-4">
            <AccordionTrigger className="text-lg uppercase items-center">
              Video Controls
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-6">
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
                      🔴 Recording in progress...
                    </p>
                  ) : (
                    <p className="text-xs text-center text-muted-foreground">
                      Records as MP4 (or WebM on Firefox).
                    </p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Original Video/Image */}
        {showOriginalMedia && (
          <AccordionItem value="original-media" className="px-4">
            <AccordionTrigger className="text-lg uppercase items-center">
              Original {isVideo ? "Video" : "Image"}
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-6">
                {imageFile &&
                  (isVideo && previewVideoUrl ? (
                    <video
                      key={previewVideoUrl}
                      src={previewVideoUrl}
                      className="w-full h-auto max-h-48 object-contain rounded border border-border mx-auto"
                      controls
                      muted={false}
                      loop
                      preload="metadata"
                    />
                  ) : !isVideo ? (
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Original"
                      className="w-32 h-32 object-cover rounded border border-border mx-auto"
                    />
                  ) : null)}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Halftone Settings */}
        <AccordionItem value="halftone-settings" className="px-4">
          <AccordionTrigger className="text-lg uppercase items-center">
            Halftone Settings
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Blend Mode</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Subtractive: Traditional CMYK (dark inks on light paper)</p>
                      <p>Additive: For light inks on dark backgrounds</p>
                      <p>Normal: Most flexible, works with any colors</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={blendMode.toString()}
                  onValueChange={(value) => setBlendMode(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Subtractive (CMYK)</SelectItem>
                    <SelectItem value="1">Additive</SelectItem>
                    <SelectItem value="2">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Contrast: {contrast[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjusts the tonal range of the image before halftone processing</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={0.3}
                  max={2.0}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Blur (Pre-filter): {blur[0].toFixed(1)}px</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Softens edges before halftone processing to reduce harsh cutoffs</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={blur} onValueChange={setBlur} min={0} max={30.0} step={0.1} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Threshold (Cutoff): {threshold[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminates small dots below this value to remove artifacts (0.05-0.15 recommended)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={threshold} onValueChange={setThreshold} min={0} max={0.5} step={0.01} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Frequency: {frequency[0]}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Controls the density of halftone dots - higher values = more dots</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={frequency} onValueChange={setFrequency} min={50} max={200} step={5} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Dot Size: {dotSize[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum size of halftone dots - larger values = bigger dots</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={dotSize} onValueChange={setDotSize} min={0.1} max={1.0} step={0.05} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Dot Roughness: {roughness[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adds irregular edges to dots for a more organic, vintage printing look</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={roughness} onValueChange={setRoughness} min={0} max={2} step={0.05} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Edge Fuzz: {fuzz[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Controls the softness of dot edges - higher values create smoother transitions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={fuzz} onValueChange={setFuzz} min={0} max={0.5} step={0.01} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Paper Noise: {paperNoise[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adds texture variation to the paper surface for a more realistic look</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={paperNoise} onValueChange={setPaperNoise} min={0} max={1} step={0.05} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Ink Noise: {inkNoise[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Simulates ink density variation for authentic printing imperfections</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={inkNoise} onValueChange={setInkNoise} min={0} max={1} step={0.05} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Dot Randomness: {randomness[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Randomly shifts dot positions to break up regular grid patterns</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider value={randomness} onValueChange={setRandomness} min={0} max={0.4} step={0.05} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Ink Colors */}
        <AccordionItem value="ink-colors" className="px-4">
          <AccordionTrigger className="text-lg uppercase items-center">
            Ink Colors
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2 pb-6">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-xs text-center">Cyan</Label>
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker value={cyanInk} onChange={setCyanInk} />
                  <span className="text-xs text-muted-foreground text-center">
                    {cyanInk.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-xs text-center">Magenta</Label>
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker value={magentaInk} onChange={setMagentaInk} />
                  <span className="text-xs text-muted-foreground text-center">
                    {magentaInk.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-xs text-center">Yellow</Label>
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker value={yellowInk} onChange={setYellowInk} />
                  <span className="text-xs text-muted-foreground text-center">
                    {yellowInk.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-xs text-center">Black</Label>
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker value={blackInk} onChange={setBlackInk} />
                  <span className="text-xs text-muted-foreground text-center">
                    {blackInk.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2 col-span-2 pt-4">
                <Label className="text-xs text-center">Paper Color</Label>
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker value={paperColor} onChange={setPaperColor} />
                  <span className="text-xs text-muted-foreground text-center">
                    {paperColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Layer Visibility */}
        <AccordionItem value="layer-visibility" className="px-4">
          <AccordionTrigger className="text-lg uppercase items-center">
            Layer Visibility
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2 pb-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="cyan" checked={showCyan} onCheckedChange={setShowCyan} />
                <Label htmlFor="cyan" className="text-sm text-cyan-600">
                  Cyan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="magenta" checked={showMagenta} onCheckedChange={setShowMagenta} />
                <Label htmlFor="magenta" className="text-sm text-pink-600">
                  Magenta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="yellow" checked={showYellow} onCheckedChange={setShowYellow} />
                <Label htmlFor="yellow" className="text-sm text-yellow-600">
                  Yellow
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="black" checked={showBlack} onCheckedChange={setShowBlack} />
                <Label htmlFor="black" className="text-sm text-gray-800">
                  Black
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Screen Angles */}
        <AccordionItem value="screen-angles" className="px-4">
          <AccordionTrigger className="text-lg uppercase items-center">
            Screen Angles
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-8 pt-2 px-4 py-6">
              <Knob
                value={cyanAngle[0]}
                onChange={(value) => setCyanAngle([value])}
                min={-90}
                max={90}
                step={5}
                label="Cyan"
                size={35}
              />
              <Knob
                value={magentaAngle[0]}
                onChange={(value) => setMagentaAngle([value])}
                min={-90}
                max={90}
                step={5}
                label="Magenta"
                size={35}
              />
              <Knob
                value={yellowAngle[0]}
                onChange={(value) => setYellowAngle([value])}
                min={-90}
                max={90}
                step={5}
                label="Yellow"
                size={35}
              />
              <Knob
                value={blackAngle[0]}
                onChange={(value) => setBlackAngle([value])}
                min={-90}
                max={90}
                step={5}
                label="Black"
                size={35}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  );
}
