// Default values for all halftone controls
export const DEFAULTS = {
  frequency: 85,
  dotSize: 1.0,
  roughness: 2.0,
  fuzz: 0.1,
  paperNoise: 0.0,
  inkNoise: 0.6,
  randomness: 0.2,
  contrast: 1.0,
  lightness: 0.0,
  blur: 1.0,
  threshold: 0.05,
  blendMode: 0,
  cyanAngle: 15,
  magentaAngle: 75,
  yellowAngle: 0,
  blackAngle: 45,
  cyanInk: '#00FFFF',
  cyanAlpha: 0.95,
  magentaInk: '#FF00FF',
  magentaAlpha: 0.95,
  yellowInk: '#FFFF00',
  yellowAlpha: 0.95,
  blackInk: '#000000',
  blackAlpha: 0.95,
  paperColor: '#f8f4e8',
  showCyan: true,
  showMagenta: true,
  showYellow: true,
  showBlack: true
} as const;

export interface HalftoneSettings {
  frequency: number;
  dotSize: number;
  roughness: number;
  fuzz: number;
  paperNoise: number;
  inkNoise: number;
  randomness: number;
  contrast: number;
  lightness: number;
  blur: number;
  threshold: number;
  blendMode: number;
  cyanAngle: number;
  magentaAngle: number;
  yellowAngle: number;
  blackAngle: number;
  cyanInk: string;
  cyanAlpha: number;
  magentaInk: string;
  magentaAlpha: number;
  yellowInk: string;
  yellowAlpha: number;
  blackInk: string;
  blackAlpha: number;
  paperColor: string;
  showCyan: boolean;
  showMagenta: boolean;
  showYellow: boolean;
  showBlack: boolean;
}

export interface PluginMessage {
  type: string;
  imageData?: Uint8Array;
  width?: number;
  height?: number;
  message?: string;
}

