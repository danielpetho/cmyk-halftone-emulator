import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { WebGLHalftoneProcessor } from "./components/WebGLHalftoneProcessor";

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleReset = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setImageUrl(null);
  };

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      {!imageFile ? (
        <LandingPage
          onImageUpload={handleImageUpload}
          uploadedImage={imageUrl}
          onReset={handleReset}
        />
      ) : (
        <WebGLHalftoneProcessor 
          imageFile={imageFile}
          onReset={handleReset}
        />
      )}
    </div>
  );
}