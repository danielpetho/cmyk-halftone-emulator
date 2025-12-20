import { HalftoneRenderer } from './webgl';
import { setupControls, getSettings, resetDefaults } from './controls';
import type { PluginMessage } from './constants';

const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const mainArea = document.getElementById('main-area') as HTMLElement;
const emptyState = document.getElementById('empty-state') as HTMLElement;
const loading = document.getElementById('loading') as HTMLElement;

const renderer = new HalftoneRenderer(canvas);

function render(): void {
  if (renderer.isImageLoaded) {
    renderer.render(getSettings());
  }
}

async function applyHalftone(): Promise<void> {
  if (!renderer.isImageLoaded) return;

  render();
  
  try {
    const blob = await renderer.getImageBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    parent.postMessage({
      pluginMessage: {
        type: 'apply-halftone',
        imageData: uint8Array,
        width: renderer.imageWidth,
        height: renderer.imageHeight
      }
    }, '*');
  } catch (error) {
    console.error('Failed to apply halftone:', error);
  }
}

function cancel(): void {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
}

function showMessage(title: string, message: string): void {
  loading.style.display = 'none';
  canvas.style.display = 'none';
  emptyState.innerHTML = `<h2>${title}</h2><p>${message}</p>`;
  emptyState.style.display = 'block';
}

async function handleMessage(msg: PluginMessage): Promise<void> {
  switch (msg.type) {
    case 'image-data':
      if (!msg.imageData) return;
      
      try {
        loading.style.display = 'block';
        emptyState.style.display = 'none';
        
        const img = await renderer.loadImageFromBytes(msg.imageData);
        const maxWidth = mainArea.clientWidth - 40;
        const maxHeight = mainArea.clientHeight - 40;
        renderer.setupTexture(img, maxWidth, maxHeight);
        render();
        
        canvas.style.display = 'block';
        loading.style.display = 'none';
      } catch (error) {
        showMessage('Error loading image', (error as Error).message);
      }
      break;

    case 'no-selection':
      showMessage('Select an image', msg.message || 'Please select an image or shape with an image fill.');
      break;

    case 'error':
      showMessage('Error', msg.message || 'An error occurred.');
      break;
  }
}

function init(): void {
  if (!renderer.init()) {
    showMessage('WebGL not supported', 'This plugin requires WebGL. Please try a different browser.');
    return;
  }

  setupControls(render);

  (window as any).applyHalftone = applyHalftone;
  (window as any).cancel = cancel;
  (window as any).resetDefaults = () => resetDefaults(render);
  (window as any).toggleSection = (header: HTMLElement) => {
    const content = header.nextElementSibling as HTMLElement;
    const arrow = header.querySelector('span:last-child') as HTMLElement;
    content.classList.toggle('collapsed');
    arrow.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
  };

  window.onmessage = (event: MessageEvent) => {
    const msg = event.data.pluginMessage;
    if (msg) handleMessage(msg);
  };

  parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

