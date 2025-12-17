import React, { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Upload, Trash2 } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  uploadedImage: string | null;
  onReset: () => void;
}

const isImageFile = (file: File): boolean => {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tiff"].includes(ext || "");
};

const isVideoFile = (file: File): boolean => {
  if (file.type.startsWith("video/")) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ["mp4", "mov", "webm", "avi", "mkv", "m4v", "3gp"].includes(ext || "");
};

const isMediaFile = (file: File): boolean => isImageFile(file) || isVideoFile(file);

export function ImageUpload({
  onImageUpload,
  uploadedImage,
  onReset,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setError(null);

      const files: File[] = Array.from(e.dataTransfer.files);
      const mediaFile = files.find((file: File) => isMediaFile(file));

      if (mediaFile) {
        const maxSize = 100; // 100MB limit
        if (mediaFile.size <= maxSize * 1024 * 1024) {
          onImageUpload(mediaFile);
        } else {
          setError(`File too large. Max size: ${maxSize}MB`);
        }
      }
    },
    [onImageUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (file) {
        // Check if it's a valid media file
        if (!isMediaFile(file)) {
          setError("Please select an image or video file");
          e.target.value = "";
          return;
        }
        const maxSize = 100; // 100MB limit
        if (file.size <= maxSize * 1024 * 1024) {
          onImageUpload(file);
        } else {
          setError(`File too large. Max size: ${maxSize}MB`);
        }
      }
      // Reset input
      e.target.value = "";
    },
    [onImageUpload],
  );

  return (
    <div className="w-full">
      {!uploadedImage ? (
        <div
          className={`p-12 max-w-full h-full bg-background border-2 border-dashed transition-colors cursor-pointer ${
            isDragOver
              ? "border-primary bg-accent"
              : "border-muted-foreground/25"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="mb-2">
                Drag and drop an image or video here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (100MB max)
              </p>
              {error && (
                <p className="text-sm mb-4" style={{ color: "red" }}>{error}</p>
              )}
              <Button asChild>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Choose File
                </label>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}