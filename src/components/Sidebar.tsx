import { Button } from "./ui/button";
import { Download, Trash2 } from "lucide-react";
import { HalftoneControls, HalftoneSettings } from "./HalftoneControls";
import { VideoControlsProps } from "./VideoControls";

interface SidebarProps {
  settings: HalftoneSettings;
  imageFile: File | null;
  isVideo?: boolean;
  previewVideoUrl?: string | null;
  onReset: () => void;
  onDownload: () => void;
  videoControls?: VideoControlsProps;
}

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
