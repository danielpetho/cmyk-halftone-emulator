import { Button } from "./ui/button";
import { Download, RotateCcw, ImagePlus } from "lucide-react";
import { HalftoneControls, HalftoneSettings } from "./HalftoneControls";
import { VideoControlsProps } from "./VideoControls";

interface SidebarProps {
  settings: HalftoneSettings;
  imageFile: File | null;
  isVideo?: boolean;
  previewVideoUrl?: string | null;
  onResetDefaults: () => void;
  onGoHome: () => void;
  onSwapMedia: () => void;
  onDownload: () => void;
  videoControls?: VideoControlsProps;
}

export function Sidebar({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  onResetDefaults,
  onGoHome,
  onSwapMedia,
  onDownload,
  videoControls,
}: SidebarProps) {
  return (
    <div className="h-screen flex flex-col w-[320px]!">
      {/* Header with logo/home button */}

        <button
          onClick={onGoHome}
          className=" h-16 rounded-md hover:bg-muted transition-colors cursor-pointer flex items-center p-4 border-b border-border"
          title="Back to home"
        >
          <img src="/favicon-32x32.png" alt="Home" className="w-5 h-5" />
          <h2 className="text-sm font-semibold uppercase">CMYK Halftone Emulator</h2>

        </button>


      {/* Scrollable accordion controls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <HalftoneControls
          settings={settings}
          imageFile={imageFile}
          isVideo={isVideo}
          previewVideoUrl={previewVideoUrl}
          videoControls={videoControls}
        />
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onResetDefaults} className="flex-1 cursor-pointer" title="Reset to defaults">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={onSwapMedia} className="flex-1 cursor-pointer" title="Change image/video">
            <ImagePlus className="w-4 h-4" />
          </Button>
        </div>
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
