import React, { useState, useCallback } from "react";
import { LandingPage } from "./components/LandingPage";
import { WebGLHalftoneProcessor } from "./components/WebGLHalftoneProcessor";

export default function App() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const handleMediaUpload = useCallback((file: File) => {
    // Revoke old URL if exists
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video/"));
  }, [mediaUrl]);

  const handleReset = useCallback(() => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaFile(null);
    setMediaUrl(null);
    setIsVideo(false);
  }, [mediaUrl]);

  return (
    <div className="h-screen w-screen bg-background overflow-hidden overscroll-contain! ">
      {!mediaFile ? (
        <LandingPage
          onImageUpload={handleMediaUpload}
          uploadedImage={mediaUrl}
          onReset={handleReset}
        />
      ) : (
        <WebGLHalftoneProcessor 
          imageFile={mediaFile}
          onReset={handleReset}
          onSwapMedia={handleMediaUpload}
          isVideo={isVideo}
        />
      )}
    </div>
  );
}