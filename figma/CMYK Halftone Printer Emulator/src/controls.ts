import { DEFAULTS, type HalftoneSettings } from './constants';

type RenderCallback = () => void;

// Get element helper
function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// Get input value
function getInputValue(id: string, type: 'number' | 'boolean' | 'string' = 'number'): number | boolean | string {
  const el = $(id) as HTMLInputElement | null;
  if (!el) return type === 'boolean' ? false : type === 'number' ? 0 : '';
  
  if (type === 'boolean') {
    return el.checked;
  } else if (type === 'number') {
    return parseFloat(el.value);
  }
  return el.value;
}

// Get current settings from UI
export function getSettings(): HalftoneSettings {
  return {
    frequency: getInputValue('frequency') as number,
    dotSize: getInputValue('dotSize') as number,
    roughness: getInputValue('roughness') as number,
    fuzz: getInputValue('fuzz') as number,
    paperNoise: getInputValue('paperNoise') as number,
    inkNoise: getInputValue('inkNoise') as number,
    randomness: getInputValue('randomness') as number,
    contrast: getInputValue('contrast') as number,
    lightness: getInputValue('lightness') as number,
    blur: getInputValue('blur') as number,
    threshold: getInputValue('threshold') as number,
    blendMode: getInputValue('blendMode') as number,
    cyanAngle: getInputValue('cyanAngle') as number,
    magentaAngle: getInputValue('magentaAngle') as number,
    yellowAngle: getInputValue('yellowAngle') as number,
    blackAngle: getInputValue('blackAngle') as number,
    cyanInk: getInputValue('cyanInk', 'string') as string,
    cyanAlpha: getInputValue('cyanAlpha') as number,
    magentaInk: getInputValue('magentaInk', 'string') as string,
    magentaAlpha: getInputValue('magentaAlpha') as number,
    yellowInk: getInputValue('yellowInk', 'string') as string,
    yellowAlpha: getInputValue('yellowAlpha') as number,
    blackInk: getInputValue('blackInk', 'string') as string,
    blackAlpha: getInputValue('blackAlpha') as number,
    paperColor: getInputValue('paperColor', 'string') as string,
    showCyan: getInputValue('showCyan', 'boolean') as boolean,
    showMagenta: getInputValue('showMagenta', 'boolean') as boolean,
    showYellow: getInputValue('showYellow', 'boolean') as boolean,
    showBlack: getInputValue('showBlack', 'boolean') as boolean
  };
}

// Update value display
function updateValueDisplay(id: string, value: string | number, suffix = ''): void {
  const el = $(`${id}-val`);
  if (el) {
    el.textContent = value + suffix;
  }
}

// Toggle section collapse
export function toggleSection(header: HTMLElement): void {
  const content = header.nextElementSibling as HTMLElement;
  const arrow = header.querySelector('span:last-child') as HTMLElement;
  content.classList.toggle('collapsed');
  arrow.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
}

// Setup all control event listeners
export function setupControls(onRender: RenderCallback): void {
  // Range inputs configuration
  const rangeInputs: Array<{ id: string; suffix?: string; decimals?: number }> = [
    { id: 'frequency' },
    { id: 'dotSize', decimals: 2 },
    { id: 'roughness', decimals: 1 },
    { id: 'fuzz', decimals: 2 },
    { id: 'paperNoise', decimals: 2 },
    { id: 'inkNoise', decimals: 2 },
    { id: 'randomness', decimals: 2 },
    { id: 'contrast', decimals: 2 },
    { id: 'lightness', decimals: 2 },
    { id: 'blur', decimals: 1 },
    { id: 'threshold', decimals: 2 },
    { id: 'cyanAngle', suffix: '°' },
    { id: 'magentaAngle', suffix: '°' },
    { id: 'yellowAngle', suffix: '°' },
    { id: 'blackAngle', suffix: '°' },
    { id: 'cyanAlpha', decimals: 2 },
    { id: 'magentaAlpha', decimals: 2 },
    { id: 'yellowAlpha', decimals: 2 },
    { id: 'blackAlpha', decimals: 2 }
  ];

  rangeInputs.forEach(({ id, suffix = '', decimals }) => {
    const input = $(id) as HTMLInputElement | null;
    if (input) {
      input.addEventListener('input', () => {
        const val = decimals !== undefined 
          ? parseFloat(input.value).toFixed(decimals) 
          : input.value;
        updateValueDisplay(id, val, suffix);
        onRender();
      });
    }
  });

  // Color inputs
  const colorInputs = ['cyanInk', 'magentaInk', 'yellowInk', 'blackInk', 'paperColor'];
  colorInputs.forEach(id => {
    const colorInput = $(id) as HTMLInputElement | null;
    const textInput = $(`${id}-text`) as HTMLInputElement | null;
    
    if (colorInput && textInput) {
      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value.toUpperCase();
        onRender();
      });
      
      textInput.addEventListener('change', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
          colorInput.value = textInput.value;
          onRender();
        }
      });
    }
  });

  // Checkboxes
  const checkboxes = ['showCyan', 'showMagenta', 'showYellow', 'showBlack'];
  checkboxes.forEach(id => {
    const checkbox = $(id) as HTMLInputElement | null;
    if (checkbox) {
      checkbox.addEventListener('change', onRender);
    }
  });

  // Blend mode
  const blendMode = $('blendMode');
  if (blendMode) {
    blendMode.addEventListener('change', onRender);
  }

  // Section toggles
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => toggleSection(header as HTMLElement));
  });
}

// Reset all controls to defaults
export function resetDefaults(onRender: RenderCallback): void {
  const setInput = (id: string, value: string | number | boolean) => {
    const el = $(id) as HTMLInputElement | null;
    if (!el) return;
    
    if (typeof value === 'boolean') {
      el.checked = value;
    } else {
      el.value = String(value);
    }
  };

  // Set all values
  setInput('frequency', DEFAULTS.frequency);
  setInput('dotSize', DEFAULTS.dotSize);
  setInput('roughness', DEFAULTS.roughness);
  setInput('fuzz', DEFAULTS.fuzz);
  setInput('paperNoise', DEFAULTS.paperNoise);
  setInput('inkNoise', DEFAULTS.inkNoise);
  setInput('randomness', DEFAULTS.randomness);
  setInput('contrast', DEFAULTS.contrast);
  setInput('lightness', DEFAULTS.lightness);
  setInput('blur', DEFAULTS.blur);
  setInput('threshold', DEFAULTS.threshold);
  setInput('blendMode', DEFAULTS.blendMode);
  
  setInput('cyanAngle', DEFAULTS.cyanAngle);
  setInput('magentaAngle', DEFAULTS.magentaAngle);
  setInput('yellowAngle', DEFAULTS.yellowAngle);
  setInput('blackAngle', DEFAULTS.blackAngle);
  
  setInput('cyanInk', DEFAULTS.cyanInk);
  setInput('cyanInk-text', DEFAULTS.cyanInk);
  setInput('cyanAlpha', DEFAULTS.cyanAlpha);
  
  setInput('magentaInk', DEFAULTS.magentaInk);
  setInput('magentaInk-text', DEFAULTS.magentaInk);
  setInput('magentaAlpha', DEFAULTS.magentaAlpha);
  
  setInput('yellowInk', DEFAULTS.yellowInk);
  setInput('yellowInk-text', DEFAULTS.yellowInk);
  setInput('yellowAlpha', DEFAULTS.yellowAlpha);
  
  setInput('blackInk', DEFAULTS.blackInk);
  setInput('blackInk-text', DEFAULTS.blackInk);
  setInput('blackAlpha', DEFAULTS.blackAlpha);
  
  setInput('paperColor', DEFAULTS.paperColor);
  setInput('paperColor-text', DEFAULTS.paperColor);
  
  setInput('showCyan', DEFAULTS.showCyan);
  setInput('showMagenta', DEFAULTS.showMagenta);
  setInput('showYellow', DEFAULTS.showYellow);
  setInput('showBlack', DEFAULTS.showBlack);

  // Update displays
  updateValueDisplay('frequency', DEFAULTS.frequency);
  updateValueDisplay('dotSize', DEFAULTS.dotSize.toFixed(2));
  updateValueDisplay('roughness', DEFAULTS.roughness.toFixed(1));
  updateValueDisplay('fuzz', DEFAULTS.fuzz.toFixed(2));
  updateValueDisplay('paperNoise', DEFAULTS.paperNoise.toFixed(2));
  updateValueDisplay('inkNoise', DEFAULTS.inkNoise.toFixed(2));
  updateValueDisplay('randomness', DEFAULTS.randomness.toFixed(2));
  updateValueDisplay('contrast', DEFAULTS.contrast.toFixed(2));
  updateValueDisplay('lightness', DEFAULTS.lightness.toFixed(2));
  updateValueDisplay('blur', DEFAULTS.blur.toFixed(1));
  updateValueDisplay('threshold', DEFAULTS.threshold.toFixed(2));
  updateValueDisplay('cyanAngle', DEFAULTS.cyanAngle, '°');
  updateValueDisplay('magentaAngle', DEFAULTS.magentaAngle, '°');
  updateValueDisplay('yellowAngle', DEFAULTS.yellowAngle, '°');
  updateValueDisplay('blackAngle', DEFAULTS.blackAngle, '°');
  updateValueDisplay('cyanAlpha', DEFAULTS.cyanAlpha.toFixed(2));
  updateValueDisplay('magentaAlpha', DEFAULTS.magentaAlpha.toFixed(2));
  updateValueDisplay('yellowAlpha', DEFAULTS.yellowAlpha.toFixed(2));
  updateValueDisplay('blackAlpha', DEFAULTS.blackAlpha.toFixed(2));

  onRender();
}

