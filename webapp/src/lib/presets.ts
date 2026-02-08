// Preset types and localStorage helpers

export interface PresetValues {
  frequency: number[];
  dotSize: number[];
  roughness: number[];
  fuzz: number[];
  paperNoise: number[];
  inkNoise: number[];
  randomness: number[];
  contrast: number[];
  lightness: number[];
  blur: number[];
  threshold: number[];
  blendMode: number;
  cyanAngle: number[];
  magentaAngle: number[];
  yellowAngle: number[];
  blackAngle: number[];
  cyanInk: string;
  cyanAlpha: number[];
  magentaInk: string;
  magentaAlpha: number[];
  yellowInk: string;
  yellowAlpha: number[];
  blackInk: string;
  blackAlpha: number[];
  paperColor: string;
  paperAlpha: number[];
  showCyan: boolean;
  showMagenta: boolean;
  showYellow: boolean;
  showBlack: boolean;
}

export interface Preset {
  id: string;
  name: string;
  values: PresetValues;
}

const STORAGE_KEY = "halftone-presets";

export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function addPreset(name: string, values: PresetValues): Preset {
  const presets = loadPresets();
  const preset: Preset = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    values,
  };
  presets.push(preset);
  savePresets(presets);
  return preset;
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter((p) => p.id !== id);
  savePresets(presets);
}

export function updatePreset(id: string, name: string, values: PresetValues): void {
  const presets = loadPresets();
  const index = presets.findIndex((p) => p.id === id);
  if (index !== -1) {
    presets[index] = { ...presets[index], name, values };
    savePresets(presets);
  }
}
