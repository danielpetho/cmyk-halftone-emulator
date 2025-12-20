import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMobile } from "./ui/use-mobile";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { HalftoneSettings } from "./HalftoneControls";
import { ZoomControls } from "./ZoomControls";

interface WebGLHalftoneProcessorProps {
  imageFile: File | null;
  onReset: () => void;
  onSwapMedia: (file: File) => void;
  isVideo?: boolean;
}

export interface WebGLHalftoneProcessorReturn {
  controls: React.ReactNode;
  mainCanvas: React.ReactNode;
}

// Advanced halftone shader adapted from Stefan Gustavson's demo
// Import shader source files
import vertexShaderSource from "./shaders/halftone-vertex.glsl?raw";
import fragmentShaderSource from "./shaders/halftone-fragment.glsl?raw";

// Default values for all controls
const DEFAULTS = {
  frequency: [85],
  dotSize: [1.0],
  roughness: [2.0],
  fuzz: [0.1],
  paperNoise: [0.0],
  inkNoise: [0.6],
  randomness: [0.2],
  contrast: [1.0],
  lightness: [0.0],
  blur: [1.0],
  threshold: [0.05],
  blendMode: 0,
  cyanAngle: [15],
  magentaAngle: [75],
  yellowAngle: [0],
  blackAngle: [45],
  cyanInk: "#00FFFF",
  cyanAlpha: [0.95],
  magentaInk: "#FF00FF",
  magentaAlpha: [0.95],
  yellowInk: "#FFFF00",
  yellowAlpha: [0.95],
  blackInk: "#000000",
  blackAlpha: [0.95],
  paperColor: "#f8f4e8",
  showCyan: true,
  showMagenta: true,
  showYellow: true,
  showBlack: true,
};

export function WebGLHalftoneProcessor({
  imageFile,
  onReset,
  onSwapMedia,
  isVideo = false,
}: WebGLHalftoneProcessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const uniformsRef = useRef<{
    [key: string]: WebGLUniformLocation | null;
  }>({});
  const renderRef = useRef<(() => void) | null>(null);
  const swapInputRef = useRef<HTMLInputElement>(null);

  const [frequency, setFrequency] = useState(DEFAULTS.frequency);
  const [dotSize, setDotSize] = useState(DEFAULTS.dotSize);
  const [roughness, setRoughness] = useState(DEFAULTS.roughness);
  const [fuzz, setFuzz] = useState(DEFAULTS.fuzz);
  const [paperNoise, setPaperNoise] = useState(DEFAULTS.paperNoise);
  const [inkNoise, setInkNoise] = useState(DEFAULTS.inkNoise);
  const [randomness, setRandomness] = useState(DEFAULTS.randomness);
  const [contrast, setContrast] = useState(DEFAULTS.contrast);
  const [lightness, setLightness] = useState(DEFAULTS.lightness);
  const [blur, setBlur] = useState(DEFAULTS.blur);
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [glVersion, setGlVersion] = useState(0);
  const [blendMode, setBlendMode] = useState(DEFAULTS.blendMode);

  const isMobile = useIsMobile();

  // Download function - removed render() call since canvas should already have content
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;

    if (!canvas || !gl) return;

    try {
      // Wait a frame for any pending renders, then download
      requestAnimationFrame(() => {
        try {
          // Create a regular 2D canvas to copy the WebGL content
          const downloadCanvas = document.createElement("canvas");
          const downloadCtx = downloadCanvas.getContext("2d");

          if (!downloadCtx) {
            console.error("Failed to create 2D context for download");
            return;
          }

          // Set download canvas to match the WebGL canvas dimensions
          downloadCanvas.width = canvas.width;
          downloadCanvas.height = canvas.height;

          // Copy the WebGL canvas to the 2D canvas
          downloadCtx.drawImage(canvas, 0, 0);

          // Download from the 2D canvas
          downloadCanvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Failed to create blob");
                return;
              }

              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `halftone_${Date.now()}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            },
            "image/png",
            1.0
          );
        } catch (error) {
          console.error("Error downloading image:", error);
          // Fallback to direct canvas download
          try {
            const link = document.createElement("a");
            link.download = `halftone_${Date.now()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          } catch (fallbackError) {
            console.error("Fallback download also failed:", fallbackError);
          }
        }
      });
    } catch (error) {
      console.error("Error in download function:", error);
    }
  }, []);

  // Proper halftone screen angles
  const [cyanAngle, setCyanAngle] = useState(DEFAULTS.cyanAngle);
  const [magentaAngle, setMagentaAngle] = useState(DEFAULTS.magentaAngle);
  const [yellowAngle, setYellowAngle] = useState(DEFAULTS.yellowAngle);
  const [blackAngle, setBlackAngle] = useState(DEFAULTS.blackAngle);

  const [cyanInk, setCyanInk] = useState(DEFAULTS.cyanInk);
  const [cyanAlpha, setCyanAlpha] = useState(DEFAULTS.cyanAlpha);
  const [magentaInk, setMagentaInk] = useState(DEFAULTS.magentaInk);
  const [magentaAlpha, setMagentaAlpha] = useState(DEFAULTS.magentaAlpha);
  const [yellowInk, setYellowInk] = useState(DEFAULTS.yellowInk);
  const [yellowAlpha, setYellowAlpha] = useState(DEFAULTS.yellowAlpha);
  const [blackInk, setBlackInk] = useState(DEFAULTS.blackInk);
  const [blackAlpha, setBlackAlpha] = useState(DEFAULTS.blackAlpha);
  const [paperColor, setPaperColor] = useState(DEFAULTS.paperColor);

  // Layer visibility controls
  const [showCyan, setShowCyan] = useState(DEFAULTS.showCyan);
  const [showMagenta, setShowMagenta] = useState(DEFAULTS.showMagenta);
  const [showYellow, setShowYellow] = useState(DEFAULTS.showYellow);
  const [showBlack, setShowBlack] = useState(DEFAULTS.showBlack);

  // Reset all controls to default values
  const resetToDefaults = useCallback(() => {
    setFrequency(DEFAULTS.frequency);
    setDotSize(DEFAULTS.dotSize);
    setRoughness(DEFAULTS.roughness);
    setFuzz(DEFAULTS.fuzz);
    setPaperNoise(DEFAULTS.paperNoise);
    setInkNoise(DEFAULTS.inkNoise);
    setRandomness(DEFAULTS.randomness);
    setContrast(DEFAULTS.contrast);
    setLightness(DEFAULTS.lightness);
    setBlur(DEFAULTS.blur);
    setThreshold(DEFAULTS.threshold);
    setBlendMode(DEFAULTS.blendMode);
    setCyanAngle(DEFAULTS.cyanAngle);
    setMagentaAngle(DEFAULTS.magentaAngle);
    setYellowAngle(DEFAULTS.yellowAngle);
    setBlackAngle(DEFAULTS.blackAngle);
    setCyanInk(DEFAULTS.cyanInk);
    setCyanAlpha(DEFAULTS.cyanAlpha);
    setMagentaInk(DEFAULTS.magentaInk);
    setMagentaAlpha(DEFAULTS.magentaAlpha);
    setYellowInk(DEFAULTS.yellowInk);
    setYellowAlpha(DEFAULTS.yellowAlpha);
    setBlackInk(DEFAULTS.blackInk);
    setBlackAlpha(DEFAULTS.blackAlpha);
    setPaperColor(DEFAULTS.paperColor);
    setShowCyan(DEFAULTS.showCyan);
    setShowMagenta(DEFAULTS.showMagenta);
    setShowYellow(DEFAULTS.showYellow);
    setShowBlack(DEFAULTS.showBlack);
  }, []);

  // Handle file swap
  const handleSwapFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onSwapMedia(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onSwapMedia]
  );

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  // Zoom state
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4.0;
  const ZOOM_STEP = 0.25;
  const PAN_SENSITIVITY = 0.5; // Reduce pan movement sensitivity
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);

  // Video controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState([1.0]);

  // Separate URL for preview video
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // No need for individual dot size updates in this shader approach

  // Helper function to create and compile shader
  const createShader = useCallback(
    (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    },
    []
  );

  // Helper function to create shader program
  const createProgram = useCallback(
    (
      gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ) => {
      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    },
    []
  );

  // Helper function to convert hex color to RGBA array
  const hexToRgba = useCallback(
    (hex: string, alpha: number = 1.0): [number, number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, alpha];
    },
    []
  );

  // Video control functions
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch((e) => console.error("Video play error:", e));
      setIsPlaying(true);
    }
  }, [isVideo, isPlaying]);

  const handleSeek = useCallback(
    (value: number[]) => {
      const video = videoRef.current;
      if (!video || !isVideo) return;

      const newTime = value[0];
      video.currentTime = newTime;
      setVideoProgress(newTime);
    },
    [isVideo]
  );

  const handleSpeedChange = useCallback(
    (value: number[]) => {
      const video = videoRef.current;
      if (!video || !isVideo) return;

      video.playbackRate = value[0];
      setPlaybackSpeed(value);
    },
    [isVideo]
  );

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.currentTime = Math.max(0, video.currentTime - 5);
  }, [isVideo]);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.currentTime = Math.min(video.duration, video.currentTime + 5);
  }, [isVideo]);

  // Track the selected mime type for the recording
  const selectedMimeTypeRef = useRef<string>("video/mp4");

  // Recording functions
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVideo) return;

    try {
      // Detect if we're on mobile for adjusted settings
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(
        navigator.userAgent
      );

      // Use lower framerate and bitrate on mobile for better performance
      const targetFps = isMobileDevice ? 30 : 60;
      const bitrate = isMobileDevice ? 8000000 : 25000000; // 8 Mbps mobile, 25 Mbps desktop

      // Get canvas stream
      const stream = canvas.captureStream(targetFps);

      let mediaRecorder: MediaRecorder;

      // Try different codecs in order of preference
      // Prefer MP4 for maximum playback compatibility (works everywhere)
      const codecOptions = [
        {
          mimeType: "video/mp4;codecs=avc1.42E01E",
          videoBitsPerSecond: bitrate,
        },
        { mimeType: "video/mp4;codecs=avc1", videoBitsPerSecond: bitrate },
        { mimeType: "video/mp4", videoBitsPerSecond: bitrate },
        // Fallback to WebM for Firefox and older browsers
        { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: bitrate },
        { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: bitrate },
        { mimeType: "video/webm", videoBitsPerSecond: bitrate },
      ];

      let selectedCodec: {
        mimeType: string;
        videoBitsPerSecond: number;
      } | null = null;
      for (const option of codecOptions) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          selectedCodec = option;
          break;
        }
      }

      if (selectedCodec) {
        mediaRecorder = new MediaRecorder(stream, selectedCodec);
        selectedMimeTypeRef.current = selectedCodec.mimeType;
      } else {
        mediaRecorder = new MediaRecorder(stream);
        selectedMimeTypeRef.current = "video/mp4"; // fallback
      }

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Determine file extension based on selected codec
        const isMP4 = selectedMimeTypeRef.current.includes("mp4");
        const extension = isMP4 ? "mp4" : "webm";
        const mimeType = isMP4 ? "video/mp4" : "video/webm";

        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `halftone_video_${Date.now()}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [isVideo]);

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleFitToView = useCallback(() => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Space key listener for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpaceHeld(false);
        isPanning.current = false;
        lastPanPosition.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Touch handlers refs for pinch zoom and two-finger pan
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const zoomRef = useRef(zoom);

  // Keep zoomRef in sync
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Native event listeners for wheel and touch (need { passive: false } to preventDefault)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wheel handler
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Trackpad pinch zoom sets ctrlKey to true
      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        const WHEEL_ZOOM_STEP = 0.02;
        const delta = e.deltaY > 0 ? -WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP;
        setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
      } else {
        // Two-finger scroll = pan (with sensitivity)
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX * PAN_SENSITIVITY,
          y: prev.y - e.deltaY * PAN_SENSITIVITY,
        }));
      }
    };

    // Touch start handler
    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        isPanning.current = true;
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        lastPanPosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        isPanning.current = true;
      }
    };

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length === 2) {
        e.preventDefault();

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Pinch zoom
        if (lastTouchDistance.current !== null) {
          const scale = distance / lastTouchDistance.current;
          if (Math.abs(scale - 1) > 0.01) {
            setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * scale)));
          }
          lastTouchDistance.current = distance;
        }

        // Two-finger pan
        if (lastTouchCenter.current) {
          const deltaX =
            (centerX - lastTouchCenter.current.x) * PAN_SENSITIVITY;
          const deltaY =
            (centerY - lastTouchCenter.current.y) * PAN_SENSITIVITY;
          setPanOffset((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
        }

        lastTouchCenter.current = { x: centerX, y: centerY };
      } else if (
        e.touches.length === 1 &&
        isPanning.current &&
        lastPanPosition.current
      ) {
        const deltaX =
          (e.touches[0].clientX - lastPanPosition.current.x) * PAN_SENSITIVITY;
        const deltaY =
          (e.touches[0].clientY - lastPanPosition.current.y) * PAN_SENSITIVITY;
        setPanOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        lastPanPosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    // Touch end handler
    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
      lastPanPosition.current = null;
      isPanning.current = false;
    };

    // Add listeners with passive: false to allow preventDefault
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Mouse pan (drag when zoomed in OR when space is held)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Allow panning when zoomed in OR when holding space
      if ((zoom > 1 || isSpaceHeld) && e.button === 0) {
        lastPanPosition.current = { x: e.clientX, y: e.clientY };
        isPanning.current = true;
      }
    },
    [zoom, isSpaceHeld]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPanning.current && lastPanPosition.current) {
      const deltaX = (e.clientX - lastPanPosition.current.x) * PAN_SENSITIVITY;
      const deltaY = (e.clientY - lastPanPosition.current.y) * PAN_SENSITIVITY;

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    lastPanPosition.current = null;
    isPanning.current = false;
  }, []);

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize WebGL
  useEffect(() => {
    // Only initialize WebGL when we have an image file
    if (!imageFile) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const gl =
      canvas.getContext("webgl", {
        preserveDrawingBuffer: true,
      }) ||
      canvas.getContext("experimental-webgl", {
        preserveDrawingBuffer: true,
      });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Enable standard derivatives extension for anti-aliasing
    const derivativesExt = gl.getExtension("OES_standard_derivatives");
    if (derivativesExt) {
    } else {
      console.warn(
        "OES_standard_derivatives extension not available - using fallback anti-aliasing"
      );
    }

    glRef.current = gl;

    try {
      // Create shaders
      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
      );

      if (!vertexShader || !fragmentShader) {
        console.error("Failed to create shaders");
        return;
      }

      // Create program
      const program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) {
        console.error("Failed to create program");
        return;
      }

      programRef.current = program;

      // Get uniform locations
      const uniforms = {
        u_texture: gl.getUniformLocation(program, "u_texture"),
        u_resolution: gl.getUniformLocation(program, "u_resolution"),
        u_frequency: gl.getUniformLocation(program, "u_frequency"),
        u_dotSize: gl.getUniformLocation(program, "u_dotSize"),
        u_roughness: gl.getUniformLocation(program, "u_roughness"),
        u_fuzz: gl.getUniformLocation(program, "u_fuzz"),
        u_paperNoise: gl.getUniformLocation(program, "u_paperNoise"),
        u_inkNoise: gl.getUniformLocation(program, "u_inkNoise"),
        u_randomness: gl.getUniformLocation(program, "u_randomness"),
        u_contrast: gl.getUniformLocation(program, "u_contrast"),
        u_lightness: gl.getUniformLocation(program, "u_lightness"),
        u_blur: gl.getUniformLocation(program, "u_blur"),
        u_threshold: gl.getUniformLocation(program, "u_threshold"),
        u_paperColor: gl.getUniformLocation(program, "u_paperColor"),
        u_cyanAngle: gl.getUniformLocation(program, "u_cyanAngle"),
        u_magentaAngle: gl.getUniformLocation(program, "u_magentaAngle"),
        u_yellowAngle: gl.getUniformLocation(program, "u_yellowAngle"),
        u_blackAngle: gl.getUniformLocation(program, "u_blackAngle"),
        u_cyanColor: gl.getUniformLocation(program, "u_cyanColor"),
        u_magentaColor: gl.getUniformLocation(program, "u_magentaColor"),
        u_yellowColor: gl.getUniformLocation(program, "u_yellowColor"),
        u_blackColor: gl.getUniformLocation(program, "u_blackColor"),
        u_showCyan: gl.getUniformLocation(program, "u_showCyan"),
        u_showMagenta: gl.getUniformLocation(program, "u_showMagenta"),
        u_showYellow: gl.getUniformLocation(program, "u_showYellow"),
        u_showBlack: gl.getUniformLocation(program, "u_showBlack"),
        u_blendMode: gl.getUniformLocation(program, "u_blendMode"),
      };

      uniformsRef.current = uniforms;

      // Create vertex buffer for full-screen quad
      const vertices = new Float32Array([
        -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
      ]);

      const buffer = gl.createBuffer();
      if (!buffer) {
        console.error("Failed to create buffer");
        return;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      // Set up attributes
      const positionLoc = gl.getAttribLocation(program, "a_position");
      const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");

      if (positionLoc === -1 || texCoordLoc === -1) {
        console.error("Failed to get attribute locations");
        return;
      }

      gl.enableVertexAttribArray(positionLoc);
      gl.enableVertexAttribArray(texCoordLoc);

      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

      setGlVersion((v) => v + 1);

      return () => {
        if (gl && program) {
          gl.deleteProgram(program);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
        }
      };
    } catch (error) {
      console.error("WebGL initialization error:", error);
    }
  }, [imageFile, createShader, createProgram, isMobile]);

  // Full halftone render function
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const texture = textureRef.current;
    const uniforms = uniformsRef.current;

    if (
      !gl ||
      !program ||
      !texture ||
      dimensions.width === 0 ||
      dimensions.height === 0
    ) {
      return;
    }

    try {
      gl.useProgram(program);

      // Clear canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set all uniforms with error checking
      const setUniform = (name: string, setter: () => void) => {
        try {
          setter();
          const error = gl.getError();
          if (error !== gl.NO_ERROR) {
            console.error(`WebGL error setting uniform ${name}:`, error);
          }
        } catch (e) {
          console.error(`Error setting uniform ${name}:`, e);
        }
      };

      if (uniforms.u_texture)
        setUniform("u_texture", () => gl.uniform1i(uniforms.u_texture, 0));
      if (uniforms.u_resolution)
        setUniform("u_resolution", () =>
          gl.uniform2f(
            uniforms.u_resolution,
            dimensions.width,
            dimensions.height
          )
        );
      if (uniforms.u_frequency)
        setUniform("u_frequency", () =>
          gl.uniform1f(uniforms.u_frequency, frequency[0])
        );
      if (uniforms.u_dotSize)
        setUniform("u_dotSize", () =>
          gl.uniform1f(uniforms.u_dotSize, dotSize[0])
        );
      if (uniforms.u_roughness)
        setUniform("u_roughness", () =>
          gl.uniform1f(uniforms.u_roughness, roughness[0])
        );
      if (uniforms.u_fuzz)
        setUniform("u_fuzz", () => gl.uniform1f(uniforms.u_fuzz, fuzz[0]));
      if (uniforms.u_paperNoise)
        setUniform("u_paperNoise", () =>
          gl.uniform1f(uniforms.u_paperNoise, paperNoise[0])
        );
      if (uniforms.u_inkNoise)
        setUniform("u_inkNoise", () =>
          gl.uniform1f(uniforms.u_inkNoise, inkNoise[0])
        );
      if (uniforms.u_randomness)
        setUniform("u_randomness", () =>
          gl.uniform1f(uniforms.u_randomness, randomness[0])
        );
      if (uniforms.u_contrast)
        setUniform("u_contrast", () =>
          gl.uniform1f(uniforms.u_contrast, contrast[0])
        );
      if (uniforms.u_lightness)
        setUniform("u_lightness", () =>
          gl.uniform1f(uniforms.u_lightness, lightness[0])
        );
      if (uniforms.u_blur) {
        setUniform("u_blur", () => gl.uniform1f(uniforms.u_blur, blur[0]));
      }
      if (uniforms.u_threshold)
        setUniform("u_threshold", () =>
          gl.uniform1f(uniforms.u_threshold, threshold[0])
        );

      const paperCol = hexToRgba(paperColor);
      if (uniforms.u_paperColor)
        setUniform("u_paperColor", () =>
          gl.uniform3f(
            uniforms.u_paperColor,
            paperCol[0],
            paperCol[1],
            paperCol[2]
          )
        );

      if (uniforms.u_cyanAngle)
        setUniform("u_cyanAngle", () =>
          gl.uniform1f(uniforms.u_cyanAngle, cyanAngle[0])
        );
      if (uniforms.u_magentaAngle)
        setUniform("u_magentaAngle", () =>
          gl.uniform1f(uniforms.u_magentaAngle, magentaAngle[0])
        );
      if (uniforms.u_yellowAngle)
        setUniform("u_yellowAngle", () =>
          gl.uniform1f(uniforms.u_yellowAngle, yellowAngle[0])
        );
      if (uniforms.u_blackAngle)
        setUniform("u_blackAngle", () =>
          gl.uniform1f(uniforms.u_blackAngle, blackAngle[0])
        );

      const cyanColor = hexToRgba(cyanInk, cyanAlpha[0]);
      const magentaColor = hexToRgba(magentaInk, magentaAlpha[0]);
      const yellowColor = hexToRgba(yellowInk, yellowAlpha[0]);
      const blackColor = hexToRgba(blackInk, blackAlpha[0]);

      if (uniforms.u_cyanColor)
        setUniform("u_cyanColor", () =>
          gl.uniform4f(
            uniforms.u_cyanColor,
            cyanColor[0],
            cyanColor[1],
            cyanColor[2],
            cyanColor[3]
          )
        );
      if (uniforms.u_magentaColor)
        setUniform("u_magentaColor", () =>
          gl.uniform4f(
            uniforms.u_magentaColor,
            magentaColor[0],
            magentaColor[1],
            magentaColor[2],
            magentaColor[3]
          )
        );
      if (uniforms.u_yellowColor)
        setUniform("u_yellowColor", () =>
          gl.uniform4f(
            uniforms.u_yellowColor,
            yellowColor[0],
            yellowColor[1],
            yellowColor[2],
            yellowColor[3]
          )
        );
      if (uniforms.u_blackColor)
        setUniform("u_blackColor", () =>
          gl.uniform4f(
            uniforms.u_blackColor,
            blackColor[0],
            blackColor[1],
            blackColor[2],
            blackColor[3]
          )
        );

      if (uniforms.u_showCyan)
        setUniform("u_showCyan", () =>
          gl.uniform1i(uniforms.u_showCyan, showCyan ? 1 : 0)
        );
      if (uniforms.u_showMagenta)
        setUniform("u_showMagenta", () =>
          gl.uniform1i(uniforms.u_showMagenta, showMagenta ? 1 : 0)
        );
      if (uniforms.u_showYellow)
        setUniform("u_showYellow", () =>
          gl.uniform1i(uniforms.u_showYellow, showYellow ? 1 : 0)
        );
      if (uniforms.u_showBlack)
        setUniform("u_showBlack", () =>
          gl.uniform1i(uniforms.u_showBlack, showBlack ? 1 : 0)
        );

      if (uniforms.u_blendMode)
        setUniform("u_blendMode", () =>
          gl.uniform1i(uniforms.u_blendMode, blendMode)
        );

      // Check for GL errors
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error("WebGL error before draw:", error);
        return;
      }

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const drawError = gl.getError();
      if (drawError !== gl.NO_ERROR) {
        console.error("WebGL error after draw:", drawError);
      } else {
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  }, [
    dimensions,
    frequency,
    dotSize,
    roughness,
    fuzz,
    paperNoise,
    inkNoise,
    randomness,
    contrast,
    lightness,
    blur,
    threshold,
    cyanAngle,
    magentaAngle,
    yellowAngle,
    blackAngle,
    cyanInk,
    cyanAlpha,
    magentaInk,
    magentaAlpha,
    yellowInk,
    yellowAlpha,
    blackInk,
    blackAlpha,
    paperColor,
    showCyan,
    showMagenta,
    showYellow,
    showBlack,
    blendMode,
    hexToRgba,
  ]);

  // Keep renderRef up to date with latest render function
  useEffect(() => {
    renderRef.current = render;
  }, [render]);

  // Create separate URL for preview video
  useEffect(() => {
    if (imageFile && isVideo) {
      const url = URL.createObjectURL(imageFile);
      setPreviewVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setPreviewVideoUrl(null);
      };
    } else {
      setPreviewVideoUrl(null);
    }
  }, [imageFile, isVideo]);

  // Cleanup recording on unmount or file change
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [imageFile]);

  // Load media (image or video) and create texture
  useEffect(() => {
    if (!imageFile || !glRef.current) {
      return;
    }

    const gl = glRef.current;
    let animationFrameId: number | null = null;

    const setupTexture = (width: number, height: number) => {
      // Clean up old texture
      if (textureRef.current) {
        gl.deleteTexture(textureRef.current);
      }

      // Create texture
      const texture = gl.createTexture();
      if (!texture) {
        console.error("Failed to create texture");
        return null;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set texture parameters
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      return texture;
    };

    const fitCanvasToContainer = (width: number, height: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const styles = window.getComputedStyle(container);
        const padX =
          parseFloat(styles.paddingLeft || "0") +
          parseFloat(styles.paddingRight || "0");
        const padY =
          parseFloat(styles.paddingTop || "0") +
          parseFloat(styles.paddingBottom || "0");

        const containerW = Math.max(1, (container.clientWidth || width) - padX);
        const containerH = Math.max(
          1,
          (container.clientHeight || height) - padY
        );
        const scale = Math.min(containerW / width, containerH / height);
        const displayW = Math.max(1, Math.floor(width * scale));
        const displayH = Math.max(1, Math.floor(height * scale));
        const dpr = window.devicePixelRatio || 1;

        // CSS size (display)
        canvas.style.width = displayW + "px";
        canvas.style.height = displayH + "px";
        canvas.style.display = "block";

        // Internal resolution for crisp output
        canvas.width = Math.round(displayW * dpr);
        canvas.height = Math.round(displayH * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);

        // Use display size for shader aspect correction
        setDimensions({
          width: displayW,
          height: displayH,
        });
      }
    };

    if (isVideo) {
      // Video handling
      const video = videoRef.current;
      if (!video) {
        console.error("Video ref not available");
        return;
      }

      const url = URL.createObjectURL(imageFile);

      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = url; // Set src after other properties
      video.load(); // Explicitly load the video

      const handleLoadedMetadata = () => {
        const { videoWidth, videoHeight } = video;
        setImageSize({ width: videoWidth, height: videoHeight });
        setVideoDuration(video.duration);

        const texture = setupTexture(videoWidth, videoHeight);
        if (!texture) return;

        textureRef.current = texture;
        fitCanvasToContainer(videoWidth, videoHeight);

        // Start video playback
        video.play().catch((e) => console.error("Video play error:", e));
        setIsPlaying(true);

        // Animation loop to update texture and render
        const updateVideo = () => {
          if (video.readyState >= video.HAVE_CURRENT_DATA) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            try {
              gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                video
              );
              // Use renderRef to always get the latest render function
              if (renderRef.current) {
                renderRef.current();
              }
            } catch (error) {
              console.error("Failed to update video texture:", error);
            }
          }
          animationFrameId = requestAnimationFrame(updateVideo);
        };

        updateVideo();
      };

      const handleTimeUpdate = () => {
        if (!video.seeking) {
          setVideoProgress(video.currentTime);
        }
      };

      const handlePlay = () => {
        setIsPlaying(true);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleSeeked = () => {
        setVideoProgress(video.currentTime);
      };

      const handleError = (e: ErrorEvent) => {
        console.error("Video error:", e, video.error);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("seeked", handleSeeked);
      video.addEventListener("error", handleError as any);

      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        video.pause();
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("seeked", handleSeeked);
        video.removeEventListener("error", handleError as any);
        URL.revokeObjectURL(url);
        if (textureRef.current && glRef.current) {
          glRef.current.deleteTexture(textureRef.current);
          textureRef.current = null;
        }
      };
    } else {
      // Image handling
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions - increased for better output quality
        const maxDimension = 600;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width *= scale;
          height *= scale;
        }

        setImageSize({ width, height });

        const texture = setupTexture(width, height);
        if (!texture) return;

        // Upload image to texture
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
          );

          textureRef.current = texture;

          // Fit canvas to container while preserving aspect ratio, then render
          requestAnimationFrame(() => {
            fitCanvasToContainer(width, height);
            render();
          });
        } catch (error) {
          console.error("Failed to upload texture:", error);
          gl.deleteTexture(texture);
        }
      };

      img.onerror = () => {
        console.error("Failed to load image");
      };

      const url = URL.createObjectURL(imageFile);
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
        if (textureRef.current && glRef.current) {
          glRef.current.deleteTexture(textureRef.current);
          textureRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile, isVideo, isMobile, glVersion]);

  // Render when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      render();
    }, 50); // Small delay to prevent render loops

    return () => clearTimeout(timeoutId);
  }, [render]);

  // Keep canvas fitted to container (aspect-preserving) on resize/orientation change
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const gl = glRef.current;
      if (
        !canvas ||
        !container ||
        !gl ||
        imageSize.width === 0 ||
        imageSize.height === 0
      )
        return;

      const styles = window.getComputedStyle(container);
      const padX =
        parseFloat(styles.paddingLeft || "0") +
        parseFloat(styles.paddingRight || "0");
      const padY =
        parseFloat(styles.paddingTop || "0") +
        parseFloat(styles.paddingBottom || "0");

      const containerW = Math.max(1, container.clientWidth - padX);
      const containerH = Math.max(1, container.clientHeight - padY);
      const scale = Math.min(
        containerW / imageSize.width,
        containerH / imageSize.height
      );
      const displayW = Math.max(1, Math.floor(imageSize.width * scale));
      const displayH = Math.max(1, Math.floor(imageSize.height * scale));
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = displayW + "px";
      canvas.style.height = displayH + "px";
      canvas.width = Math.round(displayW * dpr);
      canvas.height = Math.round(displayH * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      setDimensions({ width: displayW, height: displayH });
      render();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [imageSize, render]);

  if (!imageFile) {
    return null;
  }

  // Create settings object for controls components
  const settings: HalftoneSettings = useMemo(
    () => ({
      frequency,
      setFrequency,
      dotSize,
      setDotSize,
      roughness,
      setRoughness,
      fuzz,
      setFuzz,
      paperNoise,
      setPaperNoise,
      inkNoise,
      setInkNoise,
      randomness,
      setRandomness,
      contrast,
      setContrast,
      lightness,
      setLightness,
      blur,
      setBlur,
      threshold,
      setThreshold,
      blendMode,
      setBlendMode,
      cyanAngle,
      setCyanAngle,
      magentaAngle,
      setMagentaAngle,
      yellowAngle,
      setYellowAngle,
      blackAngle,
      setBlackAngle,
      cyanInk,
      setCyanInk,
      magentaInk,
      setMagentaInk,
      yellowInk,
      setYellowInk,
      blackInk,
      setBlackInk,
      paperColor,
      setPaperColor,
      showCyan,
      setShowCyan,
      showMagenta,
      setShowMagenta,
      showYellow,
      setShowYellow,
      showBlack,
      setShowBlack,
    }),
    [
      frequency,
      dotSize,
      roughness,
      fuzz,
      paperNoise,
      inkNoise,
      randomness,
      contrast,
      lightness,
      blur,
      threshold,
      blendMode,
      cyanAngle,
      magentaAngle,
      yellowAngle,
      blackAngle,
      cyanInk,
      magentaInk,
      yellowInk,
      blackInk,
      paperColor,
      showCyan,
      showMagenta,
      showYellow,
      showBlack,
    ]
  );

  // Video controls object for Sidebar
  const videoControlsProps = useMemo(
    () =>
      isVideo
        ? {
            isPlaying,
            videoProgress,
            videoDuration,
            playbackSpeed,
            isRecording,
            togglePlayPause,
            skipBackward,
            skipForward,
            handleSeek,
            handleSpeedChange,
            startRecording,
            stopRecording,
          }
        : undefined,
    [
      isVideo,
      isPlaying,
      videoProgress,
      videoDuration,
      playbackSpeed,
      isRecording,
      togglePlayPause,
      skipBackward,
      skipForward,
      handleSeek,
      handleSpeedChange,
      startRecording,
      stopRecording,
    ]
  );

  const mainCanvas = (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full flex items-center p-2 md:p-8 justify-center overflow-hidden select-none overscroll-contain!"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          touchAction: "none",
          cursor: zoom > 1 || isSpaceHeld ? "grab" : "default",
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${
              panOffset.y / zoom
            }px)`,
            transformOrigin: "center center",
            transition: isPanning.current ? "none" : "transform 0.1s ease-out",
          }}
        >
          <canvas
            ref={canvasRef}
            className="border border-border"
            style={{
              imageRendering: "auto",
            }}
          />
        </div>
        {/* Hidden video element for video texture source */}
        <video ref={videoRef} style={{ display: "none" }} />
      </div>

      {/* Zoom controls overlay - outside the zoomable area */}
      <div className="absolute bottom-4 right-4 md:bottom-0 z-10">
        <ZoomControls
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFit={handleFitToView}
        />
      </div>
    </div>
  );

  const triggerSwapMedia = useCallback(() => {
    swapInputRef.current?.click();
  }, []);

  return (
    <>
      {/* Hidden file input for swapping media */}
      <input
        ref={swapInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleSwapFile}
        className="hidden"
      />

      {isMobile ? (
        // Mobile Layout: Top/Bottom
        <div className="md:hidden h-screen flex flex-col">
          <button
            onClick={() => {}}
            className="w-7 h-7 rounded-md hover:bg-muted transition-colors cursor-pointer flex items-center "
            title="Back to home"
          >
            <img src="/favicon-32x32.png" alt="Home" className="w-8 h-8" />
          </button>

          {/* Output area - top half */}
          <div className="h-1/2 min-h-0 flex items-center justify-center bg-white!">
            {mainCanvas}
          </div>

          {/* Controls - bottom half, scrollable */}
          <div className="h-1/2 border-t border-border bg-card flex flex-col">
            <MobileSidebar
              settings={settings}
              imageFile={imageFile}
              isVideo={isVideo}
              previewVideoUrl={previewVideoUrl}
              onResetDefaults={resetToDefaults}
              onGoHome={onReset}
              onSwapMedia={triggerSwapMedia}
              onDownload={handleDownload}
              videoControls={videoControlsProps}
            />
          </div>
        </div>
      ) : (
        // Desktop/Tablet Layout: Side by side
        <div className="hidden md:flex h-screen overscroll-contain!">
          {/* Left sidebar - Controls (fixed width) */}
          <div className="border-r border-border bg-card" style={{ width: '320px', minWidth: '320px' }}>
            <Sidebar
              settings={settings}
              imageFile={imageFile}
              isVideo={isVideo}
              previewVideoUrl={previewVideoUrl}
              onResetDefaults={resetToDefaults}
              onGoHome={onReset}
              onSwapMedia={triggerSwapMedia}
              onDownload={handleDownload}
              videoControls={videoControlsProps}
            />
          </div>

          {/* Right side - Main halftone image (fills remaining space) */}
          <div className="flex-1 overscroll-contain! overflow-hidden">
            {mainCanvas}
          </div>
        </div>
      )}
    </>
  );
}
