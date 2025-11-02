import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

interface HalftoneProcessorProps {
  imageFile: File | null;
}

export interface HalftoneProcessorReturn {
  controls: React.ReactNode;
  mainCanvas: React.ReactNode;
}

interface CMYKChannels {
  cyan: number[];
  magenta: number[];
  yellow: number[];
  black: number[];
}

export function HalftoneProcessor({ imageFile }: HalftoneProcessorProps): HalftoneProcessorReturn | null {
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const cyanCanvasRef = useRef<HTMLCanvasElement>(null);
  const magentaCanvasRef = useRef<HTMLCanvasElement>(null);
  const yellowCanvasRef = useRef<HTMLCanvasElement>(null);
  const blackCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dotSize, setDotSize] = useState([3]);
  const [contrast, setContrast] = useState([1.5]);
  const [randomness, setRandomness] = useState([0.9]);
  const [inkDistortion, setInkDistortion] = useState([0.7]);
  const [inkCracks, setInkCracks] = useState([1]);
  
  const [cyanDotSize, setCyanDotSize] = useState([3]);
  const [magentaDotSize, setMagentaDotSize] = useState([3]);
  const [yellowDotSize, setYellowDotSize] = useState([3]);
  const [blackDotSize, setBlackDotSize] = useState([3]);
  
  const [cyanAngle, setCyanAngle] = useState([15]);
  const [magentaAngle, setMagentaAngle] = useState([75]);
  const [yellowAngle, setYellowAngle] = useState([0]);
  const [blackAngle, setBlackAngle] = useState([45]);
  
  const [cyanInk, setCyanInk] = useState('#00FFFF');
  const [magentaInk, setMagentaInk] = useState('#FF00FF');
  const [yellowInk, setYellowInk] = useState('#FFFF00');
  const [blackInk, setBlackInk] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#f8f4e8');

  // Layer visibility controls
  const [showCyan, setShowCyan] = useState(true);
  const [showMagenta, setShowMagenta] = useState(true);
  const [showYellow, setShowYellow] = useState(true);
  const [showBlack, setShowBlack] = useState(true);

  // Update individual dot sizes when main dot size changes
  useEffect(() => {
    const mainSize = dotSize[0];
    setCyanDotSize([mainSize]);
    setMagentaDotSize([mainSize]);
    setYellowDotSize([mainSize]);
    setBlackDotSize([mainSize]);
  }, [dotSize]);
  
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Convert RGB to CMYK
  const rgbToCmyk = useCallback((r: number, g: number, b: number) => {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    const c = k < 1 ? (1 - rNorm - k) / (1 - k) : 0;
    const m = k < 1 ? (1 - gNorm - k) / (1 - k) : 0;
    const y = k < 1 ? (1 - bNorm - k) / (1 - k) : 0;

    return { c, m, y, k };
  }, []);

  // Extract CMYK channels from image data
  const extractCMYKChannels = useCallback((imageData: ImageData): CMYKChannels => {
    const { data, width, height } = imageData;
    const channels: CMYKChannels = {
      cyan: new Array(width * height),
      magenta: new Array(width * height),
      yellow: new Array(width * height),
      black: new Array(width * height),
    };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIndex = i / 4;

      const { c, m, y, k } = rgbToCmyk(r, g, b);
      channels.cyan[pixelIndex] = c;
      channels.magenta[pixelIndex] = m;
      channels.yellow[pixelIndex] = y;
      channels.black[pixelIndex] = k;
    }

    return channels;
  }, [rgbToCmyk]);

  // Hash-based random number generator for better distribution
  const hashRandom = useCallback((seed: number, index: number = 0) => {
    const hashSeed = (seed * 374761393 + index * 668265263) >>> 0;
    const hash1 = ((hashSeed ^ (hashSeed >>> 16)) * 0x85ebca6b) >>> 0;
    const hash2 = ((hash1 ^ (hash1 >>> 13)) * 0xc2b2ae35) >>> 0;
    const final = ((hash2 ^ (hash2 >>> 16))) >>> 0;
    return (final & 0xFFFF) / 0xFFFF;
  }, []);

  // Create irregular ink-like dot shape with cracks
  const createInkDot = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    distortion: number,
    cracks: number,
    seed: number
  ) => {
    ctx.save();
    
    if (distortion === 0 && cracks === 0) {
      // Perfect circle for no distortion or cracks
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Create irregular shape based on distortion
    const points = 8 + Math.floor(distortion * 4); // More points for higher distortion
    const angleStep = (Math.PI * 2) / points;
    
    ctx.beginPath();
    
    for (let i = 0; i <= points; i++) {
      const angle = i * angleStep;
      
      // Generate seeded random values for this point using hash
      const radiusVariation = hashRandom(seed, i * 2);
      const bulgeVariation = hashRandom(seed, i * 2 + 1);
      
      // Calculate radius variation (ink bleeding effect)
      const radiusOffset = (radiusVariation - 0.5) * distortion * radius * 0.6;
      const currentRadius = Math.max(radius * 0.3, radius + radiusOffset);
      
      // Add organic bulging (ink absorption effect)
      const bulge = 1 + (bulgeVariation - 0.5) * distortion * 0.4;
      const finalRadius = currentRadius * bulge;
      
      const pointX = x + Math.cos(angle) * finalRadius;
      const pointY = y + Math.sin(angle) * finalRadius;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        // Use quadratic curves for smoother, more organic shapes
        const prevAngle = (i - 1) * angleStep;
        const prevRadiusVar = hashRandom(seed, (i - 1) * 2);
        const prevBulgeVar = hashRandom(seed, (i - 1) * 2 + 1);
        const prevRadiusOffset = (prevRadiusVar - 0.5) * distortion * radius * 0.6;
        const prevCurrentRadius = Math.max(radius * 0.3, radius + prevRadiusOffset);
        const prevBulge = 1 + (prevBulgeVar - 0.5) * distortion * 0.4;
        const prevFinalRadius = prevCurrentRadius * prevBulge;
        
        const prevX = x + Math.cos(prevAngle) * prevFinalRadius;
        const prevY = y + Math.sin(prevAngle) * prevFinalRadius;
        
        // Control point for smooth curve
        const controlAngle = prevAngle + angleStep * 0.5;
        const controlDistance = (prevFinalRadius + finalRadius) * 0.5;
        const controlX = x + Math.cos(controlAngle) * controlDistance;
        const controlY = y + Math.sin(controlAngle) * controlDistance;
        
        ctx.quadraticCurveTo(controlX, controlY, pointX, pointY);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Add cracks/holes if specified
    if (cracks > 0) {
      ctx.globalCompositeOperation = 'destination-out'; // Cut holes
      
      // Number of cracks based on dot size and crack intensity
      const numCracks = Math.floor(cracks * 6 * (radius / 10));
      
      for (let i = 0; i < numCracks; i++) {
        // Random position within the dot
        const crackX = hashRandom(seed, 100 + i * 3);
        const crackY = hashRandom(seed, 101 + i * 3);
        const crackSize = hashRandom(seed, 102 + i * 3);
        const crackAngle = hashRandom(seed, 103 + i * 3);
        
        // Position crack randomly within dot radius
        const distance = Math.sqrt(crackX) * radius * 0.7; // sqrt for uniform distribution in circle
        const angle = crackY * Math.PI * 2;
        const holeX = x + Math.cos(angle) * distance;
        const holeY = y + Math.sin(angle) * distance;
        
        // Create crack shape - elongated ellipse
        const crackWidth = crackSize * cracks * radius * 0.15;
        const crackHeight = crackWidth * (0.3 + crackSize * 0.4);
        const rotation = crackAngle * Math.PI * 2;
        
        ctx.save();
        ctx.translate(holeX, holeY);
        ctx.rotate(rotation);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, crackWidth, crackHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }
    
    ctx.restore();
  }, [hashRandom]);

  // Create halftone dots for a single channel
  const createHalftoneChannel = useCallback((
    ctx: CanvasRenderingContext2D,
    channel: number[],
    angle: number,
    color: string,
    width: number,
    height: number,
    dotSize: number,
    contrast: number,
    randomness: number,
    inkDistortion: number,
    inkCracks: number,
    channelSeed: number,
    isComposite: boolean = false
  ) => {
    const spacing = dotSize * 1.2;
    const angleRad = (angle * Math.PI) / 180;
    
    ctx.save();
    
    if (isComposite) {
      ctx.globalCompositeOperation = 'multiply';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.fillStyle = color;

    // Calculate rotated grid bounds
    const diagonal = Math.sqrt(width * width + height * height);
    const gridSize = Math.ceil(diagonal / spacing) + 2;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let gridY = -gridSize; gridY < gridSize; gridY++) {
      for (let gridX = -gridSize; gridX < gridSize; gridX++) {
        // Calculate position in rotated grid
        const localX = gridX * spacing;
        const localY = gridY * spacing;
        
        // Apply randomness with seeded pseudo-random based on position and channel
        let randomOffsetX = 0;
        let randomOffsetY = 0;
        
        if (randomness > 0) {
          // Hash-based randomness for better distribution
          const hashSeed = (gridX * 374761393 + gridY * 668265263 + channelSeed * 1664525) >>> 0;
          
          // Multiple hash operations for better randomness
          const hash1 = ((hashSeed ^ (hashSeed >>> 16)) * 0x85ebca6b) >>> 0;
          const hash2 = ((hash1 ^ (hash1 >>> 13)) * 0xc2b2ae35) >>> 0;
          const hash3 = ((hash2 ^ (hash2 >>> 16)) * 0x27d4eb2d) >>> 0;
          const hash4 = ((hash3 ^ (hash3 >>> 15)) * 0x165667b1) >>> 0;
          
          // Extract random values from different parts of the hash
          const rand1 = ((hash2 >>> 0) & 0xFFFF) / 0xFFFF;
          const rand2 = ((hash4 >>> 16) & 0xFFFF) / 0xFFFF;
          
          // Convert to [-0.5, 0.5) range for symmetric distribution
          randomOffsetX = (rand1 - 0.5) * randomness * spacing * 0.3;
          randomOffsetY = (rand2 - 0.5) * randomness * spacing * 0.3;
        }
        
        // Apply rotation around center
        const rotatedX = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
        const rotatedY = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);
        
        // Translate to canvas coordinates with randomness
        const canvasX = centerX + rotatedX + randomOffsetX;
        const canvasY = centerY + rotatedY + randomOffsetY;
        
        // Check if point is within canvas bounds
        if (canvasX < 0 || canvasX >= width || canvasY < 0 || canvasY >= height) {
          continue;
        }

        // Get pixel intensity from channel (use original position without randomness for sampling)
        const pixelX = Math.floor(centerX + rotatedX);
        const pixelY = Math.floor(centerY + rotatedY);
        const pixelIndex = pixelY * width + pixelX;
        
        if (pixelIndex >= 0 && pixelIndex < channel.length && pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          let intensity = channel[pixelIndex] * contrast;
          // Allow intensity to exceed 1.0 for dot bleeding effect when contrast > 1
          intensity = Math.max(0, intensity);
          
          // Calculate dot radius based on intensity - can exceed grid spacing for bleeding
          const radius = (intensity * dotSize) / 2;
          
          if (radius > 0.5) {
            // Create unique seed for this dot
            const dotSeed = (gridX * 73856093 + gridY * 19349663 + channelSeed * 97) & 0x7fffffff;
            
            // Create ink-like dot shape with cracks
            createInkDot(ctx, canvasX, canvasY, radius, inkDistortion, inkCracks, dotSeed);
          }
        }
      }
    }
    
    ctx.restore();
  }, [createInkDot]);

  // Load and process image
  useEffect(() => {
    if (!imageFile) {
      setImageData(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const sourceCanvas = sourceCanvasRef.current;
      if (!sourceCanvas) return;

      const ctx = sourceCanvas.getContext('2d');
      if (!ctx) return;

      // Use 400px resolution for good quality that fits properly
      const maxDimension = 400;
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width *= scale;
        height *= scale;
      }

      // Set up high-DPI source canvas
      const dpr = window.devicePixelRatio || 1;
      sourceCanvas.width = width * dpr;
      sourceCanvas.height = height * dpr;
      // Source canvas is hidden, no need for style dimensions
      ctx.scale(dpr, dpr);
      
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      
      setImageData(data);
      setDimensions({ width, height });
    };

    img.src = URL.createObjectURL(imageFile);
    
    return () => URL.revokeObjectURL(img.src);
  }, [imageFile]);

  // Render all halftone effects
  useEffect(() => {
    if (!imageData) return;

    const canvases = [
      { ref: compositeCanvasRef, isComposite: true },
      { ref: cyanCanvasRef, isComposite: false },
      { ref: magentaCanvasRef, isComposite: false },
      { ref: yellowCanvasRef, isComposite: false },
      { ref: blackCanvasRef, isComposite: false }
    ];

    const { width, height } = dimensions;
    const channels = extractCMYKChannels(imageData);

    canvases.forEach(({ ref, isComposite }) => {
      const canvas = ref.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set up high-DPI canvas for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // Set CSS dimensions to logical size so CSS scaling works properly
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Clear canvas with custom background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (isComposite) {
        // Composite view with all channels using custom ink colors and visibility settings
        if (showCyan) {
          createHalftoneChannel(ctx, channels.cyan, cyanAngle[0], cyanInk, width, height, cyanDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 1, true);
        }
        if (showMagenta) {
          createHalftoneChannel(ctx, channels.magenta, magentaAngle[0], magentaInk, width, height, magentaDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 2, true);
        }
        if (showYellow) {
          createHalftoneChannel(ctx, channels.yellow, yellowAngle[0], yellowInk, width, height, yellowDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 3, true);
        }
        if (showBlack) {
          createHalftoneChannel(ctx, channels.black, blackAngle[0], blackInk, width, height, blackDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 4, true);
        }
      } else {
        // Individual channel views with their custom ink colors
        if (ref === cyanCanvasRef) {
          createHalftoneChannel(ctx, channels.cyan, cyanAngle[0], cyanInk, width, height, cyanDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 1, false);
        } else if (ref === magentaCanvasRef) {
          createHalftoneChannel(ctx, channels.magenta, magentaAngle[0], magentaInk, width, height, magentaDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 2, false);
        } else if (ref === yellowCanvasRef) {
          createHalftoneChannel(ctx, channels.yellow, yellowAngle[0], yellowInk, width, height, yellowDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 3, false);
        } else if (ref === blackCanvasRef) {
          createHalftoneChannel(ctx, channels.black, blackAngle[0], blackInk, width, height, blackDotSize[0], contrast[0], randomness[0], inkDistortion[0], inkCracks[0], 4, false);
        }
      }
    });
  }, [imageData, dimensions, contrast, randomness, inkDistortion, inkCracks, cyanDotSize, magentaDotSize, yellowDotSize, blackDotSize, cyanAngle, magentaAngle, yellowAngle, blackAngle, cyanInk, magentaInk, yellowInk, blackInk, backgroundColor, showCyan, showMagenta, showYellow, showBlack, extractCMYKChannels, createHalftoneChannel]);

  if (!imageFile) {
    return null;
  }

  // Return controls and canvas separately
  const controls = (
    <div className="space-y-4 w-80">
      {/* Layer Visibility */}
      <Card className="p-4">
        <h3 className="mb-4">Layer Visibility</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="cyan" 
              checked={showCyan} 
              onCheckedChange={setShowCyan}
            />
            <Label htmlFor="cyan" className="text-sm text-cyan-600">Cyan</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="magenta" 
              checked={showMagenta} 
              onCheckedChange={setShowMagenta}
            />
            <Label htmlFor="magenta" className="text-sm text-pink-600">Magenta</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="yellow" 
              checked={showYellow} 
              onCheckedChange={setShowYellow}
            />
            <Label htmlFor="yellow" className="text-sm text-yellow-600">Yellow</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="black" 
              checked={showBlack} 
              onCheckedChange={setShowBlack}
            />
            <Label htmlFor="black" className="text-sm text-gray-800">Black</Label>
          </div>
        </div>
      </Card>

      {/* Global Controls */}
      <Card className="p-4">
        <h3 className="mb-4">Global Controls</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Master Dot Size: {dotSize[0]}px</Label>
            <Slider value={dotSize} onValueChange={setDotSize} min={3} max={20} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Contrast: {contrast[0].toFixed(1)}</Label>
            <Slider value={contrast} onValueChange={setContrast} min={0.5} max={3} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Randomness: {randomness[0].toFixed(2)}</Label>
            <Slider value={randomness} onValueChange={setRandomness} min={0} max={3} step={0.05} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Ink Distortion: {inkDistortion[0].toFixed(2)}</Label>
            <Slider value={inkDistortion} onValueChange={setInkDistortion} min={0} max={1} step={0.05} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Ink Cracks: {inkCracks[0].toFixed(2)}</Label>
            <Slider value={inkCracks} onValueChange={setInkCracks} min={0} max={1} step={0.05} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{backgroundColor}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Individual Channel Controls */}
      <Card className="p-4">
        <h3 className="mb-4">Cyan Channel</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Size: {cyanDotSize[0]}px</Label>
            <Slider value={cyanDotSize} onValueChange={setCyanDotSize} min={3} max={20} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Angle: {cyanAngle[0]}°</Label>
            <Slider value={cyanAngle} onValueChange={setCyanAngle} min={0} max={180} step={5} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">C Ink</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cyanInk}
                onChange={(e) => setCyanInk(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{cyanInk}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4">Magenta Channel</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Size: {magentaDotSize[0]}px</Label>
            <Slider value={magentaDotSize} onValueChange={setMagentaDotSize} min={3} max={20} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Angle: {magentaAngle[0]}°</Label>
            <Slider value={magentaAngle} onValueChange={setMagentaAngle} min={0} max={180} step={5} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">M Ink</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={magentaInk}
                onChange={(e) => setMagentaInk(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{magentaInk}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4">Yellow Channel</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Size: {yellowDotSize[0]}px</Label>
            <Slider value={yellowDotSize} onValueChange={setYellowDotSize} min={3} max={20} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Angle: {yellowAngle[0]}°</Label>
            <Slider value={yellowAngle} onValueChange={setYellowAngle} min={0} max={180} step={5} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Y Ink</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={yellowInk}
                onChange={(e) => setYellowInk(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{yellowInk}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-4">Black Channel</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Size: {blackDotSize[0]}px</Label>
            <Slider value={blackDotSize} onValueChange={setBlackDotSize} min={3} max={20} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Angle: {blackAngle[0]}°</Label>
            <Slider value={blackAngle} onValueChange={setBlackAngle} min={0} max={180} step={5} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">K Ink</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={blackInk}
                onChange={(e) => setBlackInk(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{blackInk}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const mainCanvas = (
    <div className="w-full h-full max-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
      <canvas
        ref={compositeCanvasRef}
        className="max-w-full max-h-full border border-border rounded shadow-lg"
        style={{ 
          imageRendering: 'auto',
          objectFit: 'contain'
        }}
      />
    </div>
  );

  return {
    controls: (
      <>
        {/* Hidden canvas for image processing */}
        <canvas ref={sourceCanvasRef} className="hidden" />
        <canvas ref={cyanCanvasRef} className="hidden" />
        <canvas ref={magentaCanvasRef} className="hidden" />
        <canvas ref={yellowCanvasRef} className="hidden" />
        <canvas ref={blackCanvasRef} className="hidden" />
        {controls}
      </>
    ),
    mainCanvas
  };
}