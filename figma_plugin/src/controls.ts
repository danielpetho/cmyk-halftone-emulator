import { DEFAULTS, type HalftoneSettings } from './constants';

type RenderCallback = () => void;

// Get element helper
function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// Get input value
function getInputValue(id: string, type: 'number' | 'boolean' | 'string' = 'number'): number | boolean | string {
  const el = $(id) as HTMLElement | null;
  if (!el) return type === 'boolean' ? false : type === 'number' ? 0 : '';
  
  if (type === 'boolean') {
    // Check for visibility toggle button (has active class) or checkbox (has checked property)
    if (el.classList.contains('visibility-toggle')) {
      return el.classList.contains('active');
    }
    return (el as HTMLInputElement).checked;
  } else if (type === 'number') {
    return parseFloat((el as HTMLInputElement).value);
  }
  return (el as HTMLInputElement).value;
}

// Get alpha value (convert 0-100 to 0-1)
function getAlphaValue(id: string): number {
  const el = $(id) as HTMLInputElement | null;
  if (!el) return 1;
  const val = parseInt(el.value, 10);
  return isNaN(val) ? 1 : Math.max(0, Math.min(100, val)) / 100;
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
    cyanAlpha: getAlphaValue('cyanAlpha'),
    magentaInk: getInputValue('magentaInk', 'string') as string,
    magentaAlpha: getAlphaValue('magentaAlpha'),
    yellowInk: getInputValue('yellowInk', 'string') as string,
    yellowAlpha: getAlphaValue('yellowAlpha'),
    blackInk: getInputValue('blackInk', 'string') as string,
    blackAlpha: getAlphaValue('blackAlpha'),
    paperColor: getInputValue('paperColor', 'string') as string,
    paperAlpha: getAlphaValue('paperAlpha'),
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

// Setup alpha drag functionality
function setupAlphaDrag(onRender: RenderCallback): void {
  const alphaGroups = document.querySelectorAll('.alpha-group[data-alpha-for]');
  
  alphaGroups.forEach(group => {
    const alphaFor = group.getAttribute('data-alpha-for');
    if (!alphaFor) return;
    
    const input = $(alphaFor) as HTMLInputElement | null;
    if (!input) return;
    
    let isDragging = false;
    let startX = 0;
    let startValue = 0;
    
    const onMouseDown = (e: MouseEvent) => {
      // Don't start drag if clicking on the input itself
      if (e.target === input) return;
      
      isDragging = true;
      startX = e.clientX;
      startValue = parseInt(input.value, 10) || 0;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const sensitivity = 0.5; // pixels per 1%
      let newValue = startValue + Math.round(deltaX * sensitivity);
      newValue = Math.max(0, Math.min(100, newValue));
      input.value = String(newValue);
      onRender();
    };
    
    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    
    group.addEventListener('mousedown', onMouseDown as EventListener);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
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

  // Alpha inputs (text-based, 0-100)
  const alphaInputs = ['cyanAlpha', 'magentaAlpha', 'yellowAlpha', 'blackAlpha', 'paperAlpha'];
  alphaInputs.forEach(id => {
    const input = $(id) as HTMLInputElement | null;
    if (input) {
      input.addEventListener('change', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val)) val = 100;
        val = Math.max(0, Math.min(100, val));
        input.value = String(val);
        onRender();
      });
      
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });
    }
  });

  // Setup alpha drag on alpha-group elements
  setupAlphaDrag(onRender);

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

  // Visibility toggles (eye icon buttons)
  const visibilityToggles = ['showCyan', 'showMagenta', 'showYellow', 'showBlack'];
  visibilityToggles.forEach(id => {
    const toggle = $(id) as HTMLButtonElement | null;
    if (toggle) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        onRender();
      });
    }
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
  setInput('paperAlpha', Math.round(DEFAULTS.paperAlpha * 100));
  
  // Set visibility toggles
  const setVisibility = (id: string, visible: boolean) => {
    const el = $(id);
    if (el) {
      if (visible) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  };
  setVisibility('showCyan', DEFAULTS.showCyan);
  setVisibility('showMagenta', DEFAULTS.showMagenta);
  setVisibility('showYellow', DEFAULTS.showYellow);
  setVisibility('showBlack', DEFAULTS.showBlack);

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

