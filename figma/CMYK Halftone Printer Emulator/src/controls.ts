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
    cyanAlpha: (getInputValue('cyanAlpha') as number) / 100,
    magentaInk: getInputValue('magentaInk', 'string') as string,
    magentaAlpha: (getInputValue('magentaAlpha') as number) / 100,
    yellowInk: getInputValue('yellowInk', 'string') as string,
    yellowAlpha: (getInputValue('yellowAlpha') as number) / 100,
    blackInk: getInputValue('blackInk', 'string') as string,
    blackAlpha: (getInputValue('blackAlpha') as number) / 100,
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
    { id: 'blackAngle', suffix: '°' }
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

  // Color inputs (text displays without #, but color input needs #)
  const colorInputs = ['cyanInk', 'magentaInk', 'yellowInk', 'blackInk', 'paperColor'];
  colorInputs.forEach(id => {
    const colorInput = $(id) as HTMLInputElement | null;
    const textInput = $(`${id}-text`) as HTMLInputElement | null;
    
    if (colorInput && textInput) {
      colorInput.addEventListener('input', () => {
        // Remove # for display
        textInput.value = colorInput.value.slice(1).toUpperCase();
        onRender();
      });
      
      textInput.addEventListener('change', () => {
        // Accept with or without #
        var val = textInput.value.replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(val)) {
          colorInput.value = '#' + val;
          textInput.value = val.toUpperCase();
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

  // Alpha number inputs (0-100) with drag support
  const alphaInputs = ['cyanAlpha', 'magentaAlpha', 'yellowAlpha', 'blackAlpha'];
  alphaInputs.forEach(id => {
    const input = $(id) as HTMLInputElement | null;
    const container = input?.parentElement;
    if (!input || !container) return;

    // Regular input change
    input.addEventListener('input', onRender);
    input.addEventListener('change', onRender);

    // Drag functionality on container
    let isDragging = false;
    let startX = 0;
    let startValue = 0;

    container.addEventListener('mousedown', function(e: MouseEvent) {
      // Don't start drag if clicking directly on input
      if (e.target === input) return;
      
      isDragging = true;
      startX = e.clientX;
      startValue = parseInt(input.value) || 0;
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e: MouseEvent) {
      if (!isDragging) return;
      
      const delta = e.clientX - startX;
      const sensitivity = 0.5; // 2 pixels per 1% change
      let newValue = startValue + Math.round(delta * sensitivity);
      newValue = Math.max(0, Math.min(100, newValue));
      input.value = String(newValue);
      onRender();
    });

    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    });
  });

  // Blend mode
  const blendMode = $('blendMode');
  if (blendMode) {
    blendMode.addEventListener('change', onRender);
  }

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
  setInput('cyanInk-text', DEFAULTS.cyanInk.slice(1));
  setInput('cyanAlpha', Math.round(DEFAULTS.cyanAlpha * 100));
  
  setInput('magentaInk', DEFAULTS.magentaInk);
  setInput('magentaInk-text', DEFAULTS.magentaInk.slice(1));
  setInput('magentaAlpha', Math.round(DEFAULTS.magentaAlpha * 100));
  
  setInput('yellowInk', DEFAULTS.yellowInk);
  setInput('yellowInk-text', DEFAULTS.yellowInk.slice(1));
  setInput('yellowAlpha', Math.round(DEFAULTS.yellowAlpha * 100));
  
  setInput('blackInk', DEFAULTS.blackInk);
  setInput('blackInk-text', DEFAULTS.blackInk.slice(1));
  setInput('blackAlpha', Math.round(DEFAULTS.blackAlpha * 100));
  
  setInput('paperColor', DEFAULTS.paperColor);
  setInput('paperColor-text', DEFAULTS.paperColor.slice(1).toUpperCase());
  
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

  onRender();
}

