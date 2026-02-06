import { Button } from "./ui/button";
import { Minus, Plus, Maximize } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function ZoomControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;

  return (
    <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <span className="text-xs font-medium w-8 text-center tabular-nums">
        {zoomPercent}%
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-5 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onFit}
        title="Fit to view"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}

