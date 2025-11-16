import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Download, Trash2, Play, Pause, SkipBack, SkipForward, Circle, Square, Info } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { Knob } from "./ui/knob";
import { ColorPicker } from "./ui/color-picker";
import { useIsMobile } from "./ui/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface WebGLHalftoneProcessorProps {
  imageFile: File | null;
  onReset: () => void;
  isVideo?: boolean;
}

export interface WebGLHalftoneProcessorReturn {
  controls: React.ReactNode;
  mainCanvas: React.ReactNode;
}

// Advanced halftone shader adapted from Stefan Gustavson's demo
// Import shader source files
import vertexShaderSource from './shaders/halftone-vertex.glsl?raw';
import fragmentShaderSource from './shaders/halftone-fragment.glsl?raw';

export function WebGLHalftoneProcessor({
  imageFile,
  onReset,
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

  const [frequency, setFrequency] = useState([85]);
  const [dotSize, setDotSize] = useState([1.0]);
  const [roughness, setRoughness] = useState([2.0]);
  const [fuzz, setFuzz] = useState([0.1]);
  const [paperNoise, setPaperNoise] = useState([0.0]);
  const [inkNoise, setInkNoise] = useState([0.6]);
  const [randomness, setRandomness] = useState([0.2]);
  const [contrast, setContrast] = useState([1.0]);
  const [blur, setBlur] = useState([1.0]);
  const [threshold, setThreshold] = useState([0.05]);
  const [glVersion, setGlVersion] = useState(0);
  const [blendMode, setBlendMode] = useState(0); // 0 = subtractive, 1 = additive, 2 = normal

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
          const downloadCanvas =
            document.createElement("canvas");
          const downloadCtx = downloadCanvas.getContext("2d");

          if (!downloadCtx) {
            console.error(
              "Failed to create 2D context for download",
            );
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
            1.0,
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
            console.error(
              "Fallback download also failed:",
              fallbackError,
            );
          }
        }
      });
    } catch (error) {
      console.error("Error in download function:", error);
    }
  }, []);

  // Proper halftone screen angles
  const [cyanAngle, setCyanAngle] = useState([15]);
  const [magentaAngle, setMagentaAngle] = useState([-15]);
  const [yellowAngle, setYellowAngle] = useState([0]);
  const [blackAngle, setBlackAngle] = useState([45]);

  const [cyanInk, setCyanInk] = useState("#00FFFF");
  const [cyanAlpha, setCyanAlpha] = useState([0.95]);
  const [magentaInk, setMagentaInk] = useState("#FF00FF");
  const [magentaAlpha, setMagentaAlpha] = useState([0.95]);
  const [yellowInk, setYellowInk] = useState("#FFFF00");
  const [yellowAlpha, setYellowAlpha] = useState([0.95]);
  const [blackInk, setBlackInk] = useState("#000000");
  const [blackAlpha, setBlackAlpha] = useState([0.95]);
  const [paperColor, setPaperColor] = useState("#f8f4e8");

  // Layer visibility controls
  const [showCyan, setShowCyan] = useState(true);
  const [showMagenta, setShowMagenta] = useState(true);
  const [showYellow, setShowYellow] = useState(true);
  const [showBlack, setShowBlack] = useState(true);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

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
    (
      gl: WebGLRenderingContext,
      type: number,
      source: string,
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          "Shader compile error:",
          gl.getShaderInfoLog(shader),
        );
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    },
    [],
  );

  // Helper function to create shader program
  const createProgram = useCallback(
    (
      gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader,
    ) => {
      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(
          "Program link error:",
          gl.getProgramInfoLog(program),
        );
        gl.deleteProgram(program);
        return null;
      }

      return program;
    },
    [],
  );

  // Helper function to convert hex color to RGBA array
  const hexToRgba = useCallback(
    (
      hex: string,
      alpha: number = 1.0,
    ): [number, number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, alpha];
    },
    [],
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

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    
    const newTime = value[0];
    video.currentTime = newTime;
    setVideoProgress(newTime);
  }, [isVideo]);

  const handleSpeedChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    
    video.playbackRate = value[0];
    setPlaybackSpeed(value);
  }, [isVideo]);

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

  // Recording functions
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVideo) return;

    try {
      // Get canvas stream at 60 fps for smoother recording
      const stream = canvas.captureStream(60);
      
      // High quality recording options
      let mediaRecorder: MediaRecorder;
      const bitrate = 25000000; // 25 Mbps for high quality
      
      // Try different codecs in order of preference
      const codecOptions = [
        { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: bitrate },
        { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: bitrate },
        { mimeType: 'video/webm', videoBitsPerSecond: bitrate },
      ];
      
      let selectedCodec: { mimeType: string; videoBitsPerSecond: number } | null = null;
      for (const option of codecOptions) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          selectedCodec = option;
          break;
        }
      }
      
      if (selectedCodec) {
        mediaRecorder = new MediaRecorder(stream, selectedCodec);
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `halftone_video_${Date.now()}.webm`;
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
    
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const derivativesExt = gl.getExtension(
      "OES_standard_derivatives",
    );
    if (derivativesExt) {

    } else {
      console.warn(
        "OES_standard_derivatives extension not available - using fallback anti-aliasing",
      );
    }

    glRef.current = gl;

    try {
      // Create shaders
      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );

      if (!vertexShader || !fragmentShader) {
        console.error("Failed to create shaders");
        return;
      }

      // Create program
      const program = createProgram(
        gl,
        vertexShader,
        fragmentShader,
      );
      if (!program) {
        console.error("Failed to create program");
        return;
      }

      programRef.current = program;

      // Get uniform locations
      const uniforms = {
        u_texture: gl.getUniformLocation(program, "u_texture"),
        u_resolution: gl.getUniformLocation(
          program,
          "u_resolution",
        ),
        u_frequency: gl.getUniformLocation(
          program,
          "u_frequency",
        ),
        u_dotSize: gl.getUniformLocation(program, "u_dotSize"),
        u_roughness: gl.getUniformLocation(
          program,
          "u_roughness",
        ),
        u_fuzz: gl.getUniformLocation(program, "u_fuzz"),
        u_paperNoise: gl.getUniformLocation(
          program,
          "u_paperNoise",
        ),
        u_inkNoise: gl.getUniformLocation(
          program,
          "u_inkNoise",
        ),
        u_randomness: gl.getUniformLocation(
          program,
          "u_randomness",
        ),
        u_contrast: gl.getUniformLocation(
          program,
          "u_contrast",
        ),
        u_blur: gl.getUniformLocation(
          program,
          "u_blur",
        ),
        u_threshold: gl.getUniformLocation(
          program,
          "u_threshold",
        ),
        u_paperColor: gl.getUniformLocation(
          program,
          "u_paperColor",
        ),
        u_cyanAngle: gl.getUniformLocation(
          program,
          "u_cyanAngle",
        ),
        u_magentaAngle: gl.getUniformLocation(
          program,
          "u_magentaAngle",
        ),
        u_yellowAngle: gl.getUniformLocation(
          program,
          "u_yellowAngle",
        ),
        u_blackAngle: gl.getUniformLocation(
          program,
          "u_blackAngle",
        ),
        u_cyanColor: gl.getUniformLocation(
          program,
          "u_cyanColor",
        ),
        u_magentaColor: gl.getUniformLocation(
          program,
          "u_magentaColor",
        ),
        u_yellowColor: gl.getUniformLocation(
          program,
          "u_yellowColor",
        ),
        u_blackColor: gl.getUniformLocation(
          program,
          "u_blackColor",
        ),
        u_showCyan: gl.getUniformLocation(
          program,
          "u_showCyan",
        ),
        u_showMagenta: gl.getUniformLocation(
          program,
          "u_showMagenta",
        ),
        u_showYellow: gl.getUniformLocation(
          program,
          "u_showYellow",
        ),
        u_showBlack: gl.getUniformLocation(
          program,
          "u_showBlack",
        ),
        u_blendMode: gl.getUniformLocation(
          program,
          "u_blendMode",
        ),
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
      const positionLoc = gl.getAttribLocation(
        program,
        "a_position",
      );
      const texCoordLoc = gl.getAttribLocation(
        program,
        "a_texCoord",
      );

      if (positionLoc === -1 || texCoordLoc === -1) {
        console.error("Failed to get attribute locations");
        return;
      }

      gl.enableVertexAttribArray(positionLoc);
      gl.enableVertexAttribArray(texCoordLoc);

      gl.vertexAttribPointer(
        positionLoc,
        2,
        gl.FLOAT,
        false,
        16,
        0,
      );
      gl.vertexAttribPointer(
        texCoordLoc,
        2,
        gl.FLOAT,
        false,
        16,
        8,
      );

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
        setUniform('u_texture', () => gl.uniform1i(uniforms.u_texture, 0));
      if (uniforms.u_resolution)
        setUniform('u_resolution', () => gl.uniform2f(
          uniforms.u_resolution,
          dimensions.width,
          dimensions.height,
        ));
      if (uniforms.u_frequency)
        setUniform('u_frequency', () => gl.uniform1f(uniforms.u_frequency, frequency[0]));
      if (uniforms.u_dotSize)
        setUniform('u_dotSize', () => gl.uniform1f(uniforms.u_dotSize, dotSize[0]));
      if (uniforms.u_roughness)
        setUniform('u_roughness', () => gl.uniform1f(uniforms.u_roughness, roughness[0]));
      if (uniforms.u_fuzz)
        setUniform('u_fuzz', () => gl.uniform1f(uniforms.u_fuzz, fuzz[0]));
      if (uniforms.u_paperNoise)
        setUniform('u_paperNoise', () => gl.uniform1f(uniforms.u_paperNoise, paperNoise[0]));
      if (uniforms.u_inkNoise)
        setUniform('u_inkNoise', () => gl.uniform1f(uniforms.u_inkNoise, inkNoise[0]));
      if (uniforms.u_randomness)
        setUniform('u_randomness', () => gl.uniform1f(uniforms.u_randomness, randomness[0]));
      if (uniforms.u_contrast)
        setUniform('u_contrast', () => gl.uniform1f(uniforms.u_contrast, contrast[0]));
      if (uniforms.u_blur) {
        setUniform('u_blur', () => gl.uniform1f(uniforms.u_blur, blur[0]));
      }
      if (uniforms.u_threshold)
        setUniform('u_threshold', () => gl.uniform1f(uniforms.u_threshold, threshold[0]));

      const paperCol = hexToRgba(paperColor);
      if (uniforms.u_paperColor)
        setUniform('u_paperColor', () => gl.uniform3f(
          uniforms.u_paperColor,
          paperCol[0],
          paperCol[1],
          paperCol[2],
        ));

      if (uniforms.u_cyanAngle)
        setUniform('u_cyanAngle', () => gl.uniform1f(uniforms.u_cyanAngle, cyanAngle[0]));
      if (uniforms.u_magentaAngle)
        setUniform('u_magentaAngle', () => gl.uniform1f(uniforms.u_magentaAngle, magentaAngle[0]));
      if (uniforms.u_yellowAngle)
        setUniform('u_yellowAngle', () => gl.uniform1f(uniforms.u_yellowAngle, yellowAngle[0]));
      if (uniforms.u_blackAngle)
        setUniform('u_blackAngle', () => gl.uniform1f(uniforms.u_blackAngle, blackAngle[0]));

      const cyanColor = hexToRgba(cyanInk, cyanAlpha[0]);
      const magentaColor = hexToRgba(
        magentaInk,
        magentaAlpha[0],
      );
      const yellowColor = hexToRgba(yellowInk, yellowAlpha[0]);
      const blackColor = hexToRgba(blackInk, blackAlpha[0]);

      if (uniforms.u_cyanColor)
        setUniform('u_cyanColor', () => gl.uniform4f(
          uniforms.u_cyanColor,
          cyanColor[0],
          cyanColor[1],
          cyanColor[2],
          cyanColor[3],
        ));
      if (uniforms.u_magentaColor)
        setUniform('u_magentaColor', () => gl.uniform4f(
          uniforms.u_magentaColor,
          magentaColor[0],
          magentaColor[1],
          magentaColor[2],
          magentaColor[3],
        ));
      if (uniforms.u_yellowColor)
        setUniform('u_yellowColor', () => gl.uniform4f(
          uniforms.u_yellowColor,
          yellowColor[0],
          yellowColor[1],
          yellowColor[2],
          yellowColor[3],
        ));
      if (uniforms.u_blackColor)
        setUniform('u_blackColor', () => gl.uniform4f(
          uniforms.u_blackColor,
          blackColor[0],
          blackColor[1],
          blackColor[2],
          blackColor[3],
        ));

      if (uniforms.u_showCyan)
        setUniform('u_showCyan', () => gl.uniform1i(uniforms.u_showCyan, showCyan ? 1 : 0));
      if (uniforms.u_showMagenta)
        setUniform('u_showMagenta', () => gl.uniform1i(
          uniforms.u_showMagenta,
          showMagenta ? 1 : 0,
        ));
      if (uniforms.u_showYellow)
        setUniform('u_showYellow', () => gl.uniform1i(uniforms.u_showYellow, showYellow ? 1 : 0));
      if (uniforms.u_showBlack)
        setUniform('u_showBlack', () => gl.uniform1i(uniforms.u_showBlack, showBlack ? 1 : 0));

      if (uniforms.u_blendMode)
        setUniform('u_blendMode', () => gl.uniform1i(uniforms.u_blendMode, blendMode));

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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
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
        const containerH = Math.max(1, (container.clientHeight || height) - padY);
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
                video,
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
            img,
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

      const containerW = Math.max(
        1,
        container.clientWidth - padX,
      );
      const containerH = Math.max(
        1,
        container.clientHeight - padY,
      );
      const scale = Math.min(
        containerW / imageSize.width,
        containerH / imageSize.height,
      );
      const displayW = Math.max(
        1,
        Math.floor(imageSize.width * scale),
      );
      const displayH = Math.max(
        1,
        Math.floor(imageSize.height * scale),
      );
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
      window.removeEventListener(
        "orientationchange",
        handleResize,
      );
    };
  }, [imageSize, render]);

  if (!imageFile) {
    return null;
  }

  // Controls
  const controls = (
    <div className="h-screen flex flex-col">
      {/* Title section */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold uppercase text-center">Halftone Controls</h2>
      </div>

      {/* Video Controls - only visible for videos */}
      {isVideo && (
        <div className="p-4 border-b border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={skipBackward}
                title="Skip backward 5s"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={skipForward}
                title="Skip forward 5s"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(videoProgress)}</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
              <Slider
                value={[videoProgress]}
                onValueChange={handleSeek}
                max={videoDuration || 100}
                step={0.1}
                className="cursor-pointer"
                disabled={!videoDuration}
        />
      </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Playback Speed: {playbackSpeed[0].toFixed(1)}x
              </Label>
              <Slider
                value={playbackSpeed}
                onValueChange={handleSpeedChange}
                min={0.25}
                max={2}
                step={0.25}
                className="cursor-pointer"
              />
            </div>

            {/* Recording controls */}
            <div className="pt-2 space-y-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Record Video
                  </>
                )}
              </Button>
              {isRecording ? (
                <p className="text-xs text-center text-muted-foreground">
                  🔴 Recording at 60fps, 25Mbps...
                </p>
              ) : (
                <p className="text-xs text-center text-muted-foreground">
                  Saves as WebM. Convert to MP4 using <a href="https://cloudconvert.com/webm-to-mp4" target="_blank" rel="noopener noreferrer" className="underline">CloudConvert</a> or FFmpeg.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable accordion controls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TooltipProvider>
          <Accordion
            type="multiple"
            defaultValue={[
              "halftone-settings",
              "layer-visibility",
              "screen-angles",
            ]}
          >
          {/* Original Video/Image */}
          <AccordionItem
            value="original-media"
            className="px-4"
          >
            <AccordionTrigger className="text-lg uppercase items-center">
              Original {isVideo ? "Video" : "Image"}
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-6">
                {imageFile && (
                  isVideo && previewVideoUrl ? (
                    <video
                      key={previewVideoUrl}
                      src={previewVideoUrl}
                      className="w-full h-auto max-h-48 object-contain rounded border border-border mx-auto"
                      controls
                      muted={false}
                      loop
                      preload="metadata"
                    />
                  ) : !isVideo ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Original"
                    className="w-32 h-32 object-cover rounded border border-border mx-auto"
                  />
                  ) : null
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Halftone Settings */}
          <AccordionItem
            value="halftone-settings"
            className="px-4"
          >
            <AccordionTrigger className="text-lg uppercase items-center">
              Halftone Settings
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm">Blend Mode</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Subtractive: Traditional CMYK (dark inks on light paper)</p>
                        <p>Additive: For light inks on dark backgrounds</p>
                        <p>Normal: Most flexible, works with any colors</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={blendMode.toString()}
                    onValueChange={(value) => setBlendMode(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Subtractive (CMYK)</SelectItem>
                      <SelectItem value="1">Additive</SelectItem>
                      <SelectItem value="2">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                      Contrast: {contrast[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adjusts the tonal range of the image before halftone processing</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={contrast}
                    onValueChange={setContrast}
                    min={0.3}
                    max={2.0}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm">
                      Blur (Pre-filter): {blur[0].toFixed(1)}px
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Softens edges before halftone processing to reduce harsh cutoffs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={blur}
                    onValueChange={setBlur}
                    min={0}
                    max={30.0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm">
                      Threshold (Cutoff): {threshold[0].toFixed(2)}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminates small dots below this value to remove artifacts (0.05-0.15 recommended)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={threshold}
                    onValueChange={setThreshold}
                    min={0}
                    max={0.5}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Frequency: {frequency[0]}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Controls the density of halftone dots - higher values = more dots</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={frequency}
                    onValueChange={setFrequency}
                    min={50}
                    max={200}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Dot Size: {dotSize[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum size of halftone dots - larger values = bigger dots</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={dotSize}
                    onValueChange={setDotSize}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Dot Roughness: {roughness[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adds irregular edges to dots for a more organic, vintage printing look</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={roughness}
                    onValueChange={setRoughness}
                    min={0}
                    max={2}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Edge Fuzz: {fuzz[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Controls the softness of dot edges - higher values create smoother transitions</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={fuzz}
                    onValueChange={setFuzz}
                    min={0}
                    max={0.5}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Paper Noise: {paperNoise[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adds texture variation to the paper surface for a more realistic look</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={paperNoise}
                    onValueChange={setPaperNoise}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Ink Noise: {inkNoise[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Simulates ink density variation for authentic printing imperfections</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={inkNoise}
                    onValueChange={setInkNoise}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                  <Label className="text-sm">
                    Dot Randomness: {randomness[0].toFixed(2)}
                  </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Randomly shifts dot positions to break up regular grid patterns</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    value={randomness}
                    onValueChange={setRandomness}
                    min={0}
                    max={0.4}
                    step={0.05}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Layer Visibility */}
          <AccordionItem
            value="layer-visibility"
            className="px-4"
          >
            <AccordionTrigger className="text-lg uppercase items-center">
              Layer Visibility
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2 pb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cyan"
                    checked={showCyan}
                    onCheckedChange={setShowCyan}
                  />
                  <Label
                    htmlFor="cyan"
                    className="text-sm text-cyan-600"
                  >
                    Cyan
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="magenta"
                    checked={showMagenta}
                    onCheckedChange={setShowMagenta}
                  />
                  <Label
                    htmlFor="magenta"
                    className="text-sm text-pink-600"
                  >
                    Magenta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="yellow"
                    checked={showYellow}
                    onCheckedChange={setShowYellow}
                  />
                  <Label
                    htmlFor="yellow"
                    className="text-sm text-yellow-600"
                  >
                    Yellow
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="black"
                    checked={showBlack}
                    onCheckedChange={setShowBlack}
                  />
                  <Label
                    htmlFor="black"
                    className="text-sm text-gray-800"
                  >
                    Black
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Screen Angles */}
          <AccordionItem value="screen-angles" className="px-4">
            <AccordionTrigger className="text-lg uppercase items-center">
              Screen Angles
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-8 pt-2 px-4 py-6">
                <Knob
                  value={cyanAngle[0]}
                  onChange={(value) => setCyanAngle([value])}
                  min={-90}
                  max={90}
                  step={5}
                  label="Cyan"
                  size={35}
                />
                <Knob
                  value={magentaAngle[0]}
                  onChange={(value) => setMagentaAngle([value])}
                  min={-90}
                  max={90}
                  step={5}
                  label="Magenta"
                  size={35}
                />
                <Knob
                  value={yellowAngle[0]}
                  onChange={(value) => setYellowAngle([value])}
                  min={-90}
                  max={90}
                  step={5}
                  label="Yellow"
                  size={35}
                />
                <Knob
                  value={blackAngle[0]}
                  onChange={(value) => setBlackAngle([value])}
                  min={-90}
                  max={90}
                  step={5}
                  label="Black"
                  size={35}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Ink Colors */}
          <AccordionItem value="ink-colors" className="px-4">
            <AccordionTrigger className="text-lg uppercase items-center">
              Ink Colors
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 pt-2 pb-6">
                <div className="flex flex-col items-center space-y-2">
                  <Label className="text-xs text-center">
                    Cyan
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <ColorPicker
                      value={cyanInk}
                      onChange={setCyanInk}
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {cyanInk.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Label className="text-xs text-center">
                    Magenta
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <ColorPicker
                      value={magentaInk}
                      onChange={setMagentaInk}
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {magentaInk.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Label className="text-xs text-center">
                    Yellow
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <ColorPicker
                      value={yellowInk}
                      onChange={setYellowInk}
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {yellowInk.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <Label className="text-xs text-center">
                    Black
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <ColorPicker
                      value={blackInk}
                      onChange={setBlackInk}
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {blackInk.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2 col-span-2 pt-4">
                  <Label className="text-xs text-center">
                    Paper Color
                  </Label>
                  <div className="flex flex-col items-center gap-2">
                    <ColorPicker
                      value={paperColor}
                      onChange={setPaperColor}
                    />
                    <span className="text-xs text-muted-foreground text-center">
                      {paperColor.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </TooltipProvider>
      </div>

      {/* Desktop: Reset and Download buttons */}
      <div className="hidden md:block p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleDownload}
          className="w-full bg-black text-white hover:bg-black/90 hover:scale-105 active:scale-95 transition-all duration-150 border-0 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          {isVideo ? "Download Current Frame" : "Download Image"}
        </Button>
      </div>
    </div>
  );

  const mainCanvas = (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-2 md:p-8"
    >
      <canvas
        ref={canvasRef}
        className="border border-border"
        style={{
          imageRendering: "auto",
        }}
      />
      {/* Hidden video element for video texture source */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
      />
    </div>
  );

  return (
    <>
      {isMobile ? (
        // Mobile Layout: Top/Bottom
        <div className="md:hidden h-screen flex flex-col">
          {/* Output area - top half */}
          <div className="h-1/2 min-h-0 flex items-center justify-center">
            {mainCanvas}
          </div>

          {/* Controls - bottom half, scrollable */}
          <div className="h-1/2 border-t border-border bg-card flex flex-col">
            {/* Scrollable controls content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="h-full flex flex-col">
                {/* Scrollable accordion controls */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <TooltipProvider>
                  <Accordion
                    type="multiple"
                    defaultValue={[
                      "halftone-settings",
                      "layer-visibility",
                      "screen-angles",
                    ]}
                  >
                    {/* Halftone Settings */}
                    <AccordionItem
                      value="halftone-settings"
                      className="px-4"
                    >
                      <AccordionTrigger className="text-lg uppercase items-center">
                        Halftone Settings
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2 pb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">Blend Mode</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Subtractive: Traditional CMYK (dark inks on light paper)</p>
                                  <p>Additive: For light inks on dark backgrounds</p>
                                  <p>Normal: Most flexible, works with any colors</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Select
                              value={blendMode.toString()}
                              onValueChange={(value) => setBlendMode(parseInt(value))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Subtractive (CMYK)</SelectItem>
                                <SelectItem value="1">Additive</SelectItem>
                                <SelectItem value="2">Normal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                              <div className="flex items-center gap-1">
                            <Label className="text-sm">
                                  Contrast: {contrast[0].toFixed(2)}
                            </Label>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Adjusts the tonal range of the image before halftone processing</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            <Slider
                              value={contrast}
                              onValueChange={setContrast}
                              min={0.3}
                              max={2.0}
                              step={0.01}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Blur (Pre-filter): {blur[0].toFixed(1)}px
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Softens edges before halftone processing to reduce harsh cutoffs</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={blur}
                              onValueChange={setBlur}
                              min={0}
                              max={30.0}
                              step={0.1}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Threshold (Cutoff): {threshold[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminates small dots below this value to remove artifacts (0.05-0.15 recommended)</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={threshold}
                              onValueChange={setThreshold}
                              min={0}
                              max={0.5}
                              step={0.01}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Frequency: {frequency[0]}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Controls the density of halftone dots - higher values = more dots</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={frequency}
                              onValueChange={setFrequency}
                              min={50}
                              max={200}
                              step={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Dot Size: {dotSize[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Maximum size of halftone dots - larger values = bigger dots</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={dotSize}
                              onValueChange={setDotSize}
                              min={0.1}
                              max={1.0}
                              step={0.05}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Dot Roughness: {roughness[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adds irregular edges to dots for a more organic, vintage printing look</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={roughness}
                              onValueChange={setRoughness}
                              min={0}
                              max={2}
                              step={0.05}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Edge Fuzz: {fuzz[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Controls the softness of dot edges - higher values create smoother transitions</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={fuzz}
                              onValueChange={setFuzz}
                              min={0}
                              max={0.5}
                              step={0.01}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Paper Noise: {paperNoise[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adds texture variation to the paper surface for a more realistic look</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={paperNoise}
                              onValueChange={setPaperNoise}
                              min={0}
                              max={1}
                              step={0.05}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Ink Noise: {inkNoise[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Simulates ink density variation for authentic printing imperfections</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={inkNoise}
                              onValueChange={setInkNoise}
                              min={0}
                              max={1}
                              step={0.05}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Label className="text-sm">
                                Dot Randomness: {randomness[0].toFixed(2)}
                              </Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Randomly shifts dot positions to break up regular grid patterns</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Slider
                              value={randomness}
                              onValueChange={setRandomness}
                              min={0}
                              max={0.4}
                              step={0.05}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Layer Visibility */}
                    <AccordionItem
                      value="layer-visibility"
                      className="px-4"
                    >
                      <AccordionTrigger className="text-lg uppercase items-center">
                        Layer Visibility
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2 pb-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="cyan"
                              checked={showCyan}
                              onCheckedChange={setShowCyan}
                            />
                            <Label
                              htmlFor="cyan"
                              className="text-sm text-cyan-600"
                            >
                              Cyan
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="magenta"
                              checked={showMagenta}
                              onCheckedChange={setShowMagenta}
                            />
                            <Label
                              htmlFor="magenta"
                              className="text-sm text-pink-600"
                            >
                              Magenta
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="yellow"
                              checked={showYellow}
                              onCheckedChange={setShowYellow}
                            />
                            <Label
                              htmlFor="yellow"
                              className="text-sm text-yellow-600"
                            >
                              Yellow
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="black"
                              checked={showBlack}
                              onCheckedChange={setShowBlack}
                            />
                            <Label
                              htmlFor="black"
                              className="text-sm text-gray-800"
                            >
                              Black
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Screen Angles */}
                    <AccordionItem
                      value="screen-angles"
                      className="px-4"
                    >
                      <AccordionTrigger className="text-lg uppercase items-center">
                        Screen Angles
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-8 pt-2 px-4 py-6">
                          <Knob
                            value={cyanAngle[0]}
                            onChange={(value) =>
                              setCyanAngle([value])
                            }
                            min={-90}
                            max={90}
                            step={5}
                            label="Cyan"
                            size={35}
                          />
                          <Knob
                            value={magentaAngle[0]}
                            onChange={(value) =>
                              setMagentaAngle([value])
                            }
                            min={-90}
                            max={90}
                            step={5}
                            label="Magenta"
                            size={35}
                          />
                          <Knob
                            value={yellowAngle[0]}
                            onChange={(value) =>
                              setYellowAngle([value])
                            }
                            min={-90}
                            max={90}
                            step={5}
                            label="Yellow"
                            size={35}
                          />
                          <Knob
                            value={blackAngle[0]}
                            onChange={(value) =>
                              setBlackAngle([value])
                            }
                            min={-90}
                            max={90}
                            step={5}
                            label="Black"
                            size={35}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Ink Colors */}
                    <AccordionItem
                      value="ink-colors"
                      className="px-4"
                    >
                      <AccordionTrigger className="text-lg uppercase items-center">
                        Ink Colors
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 pt-2 pb-6">
                          <div className="flex flex-col items-center space-y-2">
                            <Label className="text-xs text-center">
                              Cyan
                            </Label>
                            <div className="flex flex-col items-center gap-2">
                              <ColorPicker
                                value={cyanInk}
                                onChange={setCyanInk}
                              />
                              <span className="text-xs text-muted-foreground text-center">
                                {cyanInk.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <Label className="text-xs text-center">
                              Magenta
                            </Label>
                            <div className="flex flex-col items-center gap-2">
                              <ColorPicker
                                value={magentaInk}
                                onChange={setMagentaInk}
                              />
                              <span className="text-xs text-muted-foreground text-center">
                                {magentaInk.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <Label className="text-xs text-center">
                              Yellow
                            </Label>
                            <div className="flex flex-col items-center gap-2">
                              <ColorPicker
                                value={yellowInk}
                                onChange={setYellowInk}
                              />
                              <span className="text-xs text-muted-foreground text-center">
                                {yellowInk.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <Label className="text-xs text-center">
                              Black
                            </Label>
                            <div className="flex flex-col items-center gap-2">
                              <ColorPicker
                                value={blackInk}
                                onChange={setBlackInk}
                              />
                              <span className="text-xs text-muted-foreground text-center">
                                {blackInk.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-2 col-span-2 pt-4">
                            <Label className="text-xs text-center">
                              Paper Color
                            </Label>
                            <div className="flex flex-col items-center gap-2">
                              <ColorPicker
                                value={paperColor}
                                onChange={setPaperColor}
                              />
                              <span className="text-xs text-muted-foreground text-center">
                                {paperColor.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Fixed buttons at bottom */}
            <div className="p-4 border-t border-border space-y-2 bg-card">
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleDownload}
                className="w-full bg-black text-white hover:bg-black/90 hover:scale-105 active:scale-95 transition-all duration-150 border-0 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                {isVideo ? "Download Current Frame" : "Download Image"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Desktop/Tablet Layout: Side by side
        <div className="hidden md:grid md:grid-cols-4 h-screen">
          {/* Left sidebar - Controls (1/4 width) */}
          <div className="col-span-1 border-r border-border bg-card max-w-[300px]">
            {controls}
          </div>

          {/* Right side - Main halftone image (3/4 width) */}
          <div className="col-span-3 p-12">{mainCanvas}</div>
        </div>
      )}
    </>
  );
}