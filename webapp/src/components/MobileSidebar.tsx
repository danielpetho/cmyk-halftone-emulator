import { Button } from "./ui/button";
import { Download, RotateCcw, ImagePlus } from "lucide-react";
import { HalftoneControls, HalftoneSettings } from "./HalftoneControls";
import { VideoControlsProps } from "./VideoControls";

interface MobileSidebarProps {
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

export function MobileSidebar({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  onResetDefaults,
  onGoHome,
  onSwapMedia,
  onDownload,
  videoControls,
}: MobileSidebarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Scrollable controls content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <HalftoneControls
          settings={settings}
          imageFile={imageFile}
          isVideo={isVideo}
          previewVideoUrl={previewVideoUrl}
          showOriginalMedia={false}
          videoControls={videoControls}
        />
      </div>

      {/* Fixed buttons at bottom */}
      <div className="p-4 border-t border-border space-y-2 bg-card">
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
          {isVideo ? "Download Frame" : "Download"}
        </Button>
      </div>
    </div>
  );
}
