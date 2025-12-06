import React from "react";
import { Button } from "./ui/button";
import { Download, Trash2 } from "lucide-react";
import { HalftoneControls, HalftoneSettings } from "./HalftoneControls";

interface MobileSidebarProps {
  settings: HalftoneSettings;
  imageFile: File | null;
  isVideo?: boolean;
  previewVideoUrl?: string | null;
  onReset: () => void;
  onDownload: () => void;
}

export function MobileSidebar({
  settings,
  imageFile,
  isVideo = false,
  previewVideoUrl,
  onReset,
  onDownload,
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
        />
      </div>

      {/* Fixed buttons at bottom */}
      <div className="p-4 border-t border-border space-y-2 bg-card">
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

