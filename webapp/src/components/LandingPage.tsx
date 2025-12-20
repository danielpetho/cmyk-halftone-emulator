import { ImageUpload } from "./ImageUpload";
import SimpleMarquee from "./ui/simple-marquee";
import { useState, useEffect } from "react";
import { InfoModal } from "./InfoModal";

interface LandingPageProps {
  onImageUpload: (file: File) => void;
  uploadedImage: string | null;
  onReset: () => void;
}

// Create images from CDN - using actual halftone examples
const createMarqueeImages = () => {
  const images = [];
  for (let i = 0; i < 17; i++) {
    images.push({
      id: i,
      src: `https://halftone.b-cdn.net/${i}.jpeg`,
      alt: `Halftone example ${i}`,
    });
  }
  return images;
};

export function LandingPage({
  onImageUpload,
  uploadedImage,
  onReset,
}: LandingPageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const marqueeImages = createMarqueeImages();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () =>
      window.removeEventListener("resize", checkMobile);
  }, []);

  // Split 10 images into 3 rows: 4, 3, 3
  const row1Images = marqueeImages.slice(0, 7);
  const row2Images = marqueeImages.slice(5, 11);
  const row3Images = marqueeImages.slice(7, 17);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Upload section at the top */}
      <div className="h-screen w-screen flex items-center justify-center py-8 px-4 z-10 relative">
        <div className="">
          <ImageUpload
            onImageUpload={onImageUpload}
            uploadedImage={uploadedImage}
            onReset={onReset}
          />
        </div>
      </div>

      {/* Marquee sections */}
      <div className="fixed inset-0 flex-1 flex flex-col justify-center">
        {/* Row 1 - Right to Left */}
        <SimpleMarquee
          direction="right"
          baseVelocity={isMobile ? 0 : 3}
          repeat={3}
          className="h-1/3"
        >
          {row1Images.map((image) => (
            <img
              key={image.id}
              src={image.src}
              alt={image.alt}
              className="h-full w-auto object-cover"
            />
          ))}
        </SimpleMarquee>

        {/* Row 2 - Left to Right */}
        <SimpleMarquee
          direction="left"
          baseVelocity={isMobile ? 0 : 3}
          repeat={3}
          className="h-1/3"
        >
          {row2Images.map((image) => (
            <img
              key={image.id}
              src={image.src}
              alt={image.alt}
              className="h-full w-auto object-cover"
            />
          ))}
        </SimpleMarquee>

        {/* Row 3 - Right to Left */}
        <SimpleMarquee
          direction="right"
          baseVelocity={isMobile ? 0 : 3}
          repeat={3}
          className="h-1/3"
        >
          {row3Images.map((image) => (
            <img
              key={image.id}
              src={image.src}
              alt={image.alt}
              className="h-full w-auto object-cover"
            />
          ))}
        </SimpleMarquee>
      </div>

      {/* Info Modal */}
      <InfoModal />
    </div>
  );
}