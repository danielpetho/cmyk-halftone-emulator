import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
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
import { Info, Play, Pause, SkipBack, SkipForward, Circle, Square, Eye, EyeOff } from "lucide-react";
import { Knob } from "./ui/knob";
import { ColorPicker } from "./ui/color-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { VideoControlsProps } from "./VideoControls";
import { PresetSelector } from "./PresetSelector";
import type { PresetValues } from "../lib/presets";

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
  lightness: number[];
  setLightness: (v: number[]) => void;
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
  cyanAlpha: number[];
  setCyanAlpha: (v: number[]) => void;
  magentaInk: string;
  setMagentaInk: (v: string) => void;
  magentaAlpha: number[];
  setMagentaAlpha: (v: number[]) => void;
  yellowInk: string;
  setYellowInk: (v: string) => void;
  yellowAlpha: number[];
  setYellowAlpha: (v: number[]) => void;
  blackInk: string;
  setBlackInk: (v: string) => void;
  blackAlpha: number[];
  setBlackAlpha: (v: number[]) => void;
  paperColor: string;
  setPaperColor: (v: string) => void;
  paperAlpha: number[];
  setPaperAlpha: (v: number[]) => void;

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
  getCurrentValues?: () => PresetValues;
  applyPresetValues?: (v: PresetValues) => void;
  onResetDefaults?: () => void;
}

export function HalftoneControls({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  showOriginalMedia = true,
  videoControls,
  getCurrentValues,
  applyPresetValues,
  onResetDefaults,
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
    lightness,
    setLightness,
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
    cyanAlpha,
    setCyanAlpha,
    magentaInk,
    setMagentaInk,
    magentaAlpha,
    setMagentaAlpha,
    yellowInk,
    setYellowInk,
    yellowAlpha,
    setYellowAlpha,
    blackInk,
    setBlackInk,
    blackAlpha,
    setBlackAlpha,
    paperColor,
    setPaperColor,
    paperAlpha,
    setPaperAlpha,
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
    "preset",
    "blend-mode",
    "halftone-settings",
    "ink-colors",
  ];
  if (isVideo && videoControls) {
    defaultOpenSections.unshift("video-controls");
  }

  return (
    <TooltipProvider>
      <Accordion type="multiple" defaultValue={defaultOpenSections}>
        {/* Preset */}
        {getCurrentValues && applyPresetValues && onResetDefaults && (
          <AccordionItem value="preset" className="">
            <AccordionTrigger className="text-lg uppercase items-center">
              Presets
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm">Preset</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save and load your halftone settings as presets.</p>
                        <p>Presets are stored locally in your browser.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <PresetSelector
                    getCurrentValues={getCurrentValues}
                    applyValues={applyPresetValues}
                    onResetDefaults={onResetDefaults}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Video Controls - only visible for videos */}
        {isVideo && videoControls && (
          <AccordionItem value="video-controls" className="">
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
          <AccordionItem value="original-media" className="">
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

        {/* Blend Mode */}
        <AccordionItem value="blend-mode" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Blend Mode
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Mode</Label>
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Halftone Settings */}
        <AccordionItem value="halftone-settings" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Halftone Settings
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-6">
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
                <Slider value={frequency} onValueChange={setFrequency} min={20} max={500} step={1} />
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Image (Pre-filtering) */}
        <AccordionItem value="image-prefilter" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Image (Pre-filtering)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-6">
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
                  <Label className="text-sm">Lightness: {lightness[0].toFixed(2)}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjusts the overall brightness of the image before halftone processing</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={lightness}
                  onValueChange={setLightness}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">Blur: {blur[0].toFixed(1)}px</Label>
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Noise & Texture */}
        <AccordionItem value="noise-texture" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Noise & Texture
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-6">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Ink Colors & Visibility */}
        <AccordionItem value="ink-colors" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Ink Colors
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2 pb-6" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {/* Ink color rows */}
              {([
                { label: "Cyan", color: cyanInk, setColor: setCyanInk, alpha: cyanAlpha, setAlpha: setCyanAlpha, show: showCyan, setShow: setShowCyan },
                { label: "Magenta", color: magentaInk, setColor: setMagentaInk, alpha: magentaAlpha, setAlpha: setMagentaAlpha, show: showMagenta, setShow: setShowMagenta },
                { label: "Yellow", color: yellowInk, setColor: setYellowInk, alpha: yellowAlpha, setAlpha: setYellowAlpha, show: showYellow, setShow: setShowYellow },
                { label: "Black", color: blackInk, setColor: setBlackInk, alpha: blackAlpha, setAlpha: setBlackAlpha, show: showBlack, setShow: setShowBlack },
              ] as const).map(({ label, color, setColor, alpha, setAlpha, show, setShow }) => (
                <div
                  key={label}
                  className="flex items-center"
                  style={{ gap: '8px', padding: '5px 0', opacity: show ? 1 : 0.45 }}
                >
                  <span className="text-xs" style={{ width: '52px', flexShrink: 0 }}>{label}</span>
                  <ColorPicker value={color} onChange={setColor} className="w-8 h-8" style={{ borderRadius: 0 }} />
                  <span className="text-xs text-muted-foreground" style={{ flex: 1, minWidth: 0, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                    {color.slice(1).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ width: '34px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {Math.round(alpha[0] * 100)}%
                  </span>
                  <Slider
                    value={alpha}
                    onValueChange={setAlpha}
                    min={0}
                    max={1}
                    step={0.01}
                    style={{ width: '48px', flexShrink: 0 }}
                  />
                  <button
                    onClick={() => setShow(!show)}
                    className="cursor-pointer"
                    style={{ padding: '2px', background: 'none', border: 'none', opacity: show ? 0.7 : 0.35, flexShrink: 0 }}
                    title={show ? `Hide ${label}` : `Show ${label}`}
                  >
                    {show ? <Eye style={{ width: '14px', height: '14px' }} /> : <EyeOff style={{ width: '14px', height: '14px' }} />}
                  </button>
                </div>
              ))}

              {/* Separator */}
              <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

              {/* Paper / Background row */}
              <div
                className="flex items-center"
                style={{ gap: '8px', padding: '5px 0' }}
              >
                <span className="text-xs" style={{ width: '52px', flexShrink: 0 }}>Paper</span>
                <ColorPicker value={paperColor} onChange={setPaperColor} className="w-8 h-8" style={{ borderRadius: 0 }} />
                <span className="text-xs text-muted-foreground" style={{ flex: 1, minWidth: 0, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                  {paperColor.slice(1).toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground" style={{ width: '34px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {Math.round(paperAlpha[0] * 100)}%
                </span>
                <Slider
                  value={paperAlpha}
                  onValueChange={setPaperAlpha}
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: '48px', flexShrink: 0 }}
                />
                {/* Static eye icon (paper is always visible) */}
                <span style={{ padding: '2px', opacity: 0.35, flexShrink: 0 }}>
                  <Eye style={{ width: '14px', height: '14px' }} />
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Screen Angles */}
        <AccordionItem value="screen-angles" className="">
          <AccordionTrigger className="text-lg uppercase items-center">
            Screen Angles
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-8 pt-2 px-4 py-6">
              <Knob
                value={cyanAngle[0]}
                onChange={(value) => setCyanAngle([value])}
                min={0}
                max={360}
                step={5}
                label="Cyan"
                size={35}
                fullRotation
              />
              <Knob
                value={magentaAngle[0]}
                onChange={(value) => setMagentaAngle([value])}
                min={0}
                max={360}
                step={5}
                label="Magenta"
                size={35}
                fullRotation
              />
              <Knob
                value={yellowAngle[0]}
                onChange={(value) => setYellowAngle([value])}
                min={0}
                max={360}
                step={5}
                label="Yellow"
                size={35}
                fullRotation
              />
              <Knob
                value={blackAngle[0]}
                onChange={(value) => setBlackAngle([value])}
                min={0}
                max={360}
                step={5}
                label="Black"
                size={35}
                fullRotation
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  );
}
