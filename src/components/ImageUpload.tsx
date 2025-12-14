import React, { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
} from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  uploadedImage: string | null;
  onReset: () => void;
}

export function ImageUpload({
  onImageUpload,
  uploadedImage,
  onReset,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files: File[] = Array.from(e.dataTransfer.files);
      const mediaFile = files.find((file: File) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
      );

      if (mediaFile) {
        // 50MB limit for images, 100MB for videos
        const maxSize = mediaFile.type.startsWith("video/") ? 100 : 50;
        if (mediaFile.size <= maxSize * 1024 * 1024) {
          onImageUpload(mediaFile);
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
      const file = e.target.files?.[0];
      if (file) {
        // 5MB limit for images, 100MB for videos
        const maxSize = file.type.startsWith("video/") ? 100 : 5;
        if (file.size <= maxSize * 1024 * 1024) {
          onImageUpload(file);
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
                or click to browse (Images: 50MB, Videos: 100MB max)
              </p>
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