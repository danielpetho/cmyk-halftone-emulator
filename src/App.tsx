import React, { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { WebGLHalftoneProcessor } from "./components/WebGLHalftoneProcessor";

export default function App() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const handleMediaUpload = (file: File) => {
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setIsVideo(file.type.startsWith("video/"));
  };

  const handleReset = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaFile(null);
    setMediaUrl(null);
    setIsVideo(false);
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
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
          isVideo={isVideo}
        />
      )}
    </div>
  );
}