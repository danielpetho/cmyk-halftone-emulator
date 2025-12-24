import { HalftoneRenderer } from './webgl';
import { setupControls, getSettings, resetDefaults } from './controls';
import type { PluginMessage } from './constants';

const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const canvasContainer = document.getElementById('canvas-container') as HTMLElement;
const canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;
const mainArea = document.getElementById('main-area') as HTMLElement;
const emptyState = document.getElementById('empty-state') as HTMLElement;
const loading = document.getElementById('loading') as HTMLElement;
const zoomControls = document.getElementById('zoom-controls') as HTMLElement;
const zoomInBtn = document.getElementById('zoom-in') as HTMLButtonElement;
const zoomOutBtn = document.getElementById('zoom-out') as HTMLButtonElement;
const zoomFitBtn = document.getElementById('zoom-fit') as HTMLButtonElement;
const zoomValue = document.getElementById('zoom-value') as HTMLElement;

const renderer = new HalftoneRenderer(canvas);

// Zoom/Pan state
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1; 

function updateZoomDisplay(): void {
  const percent = Math.round(zoom * 100);
  zoomValue.textContent = percent + '%';
  zoomInBtn.disabled = zoom >= MAX_ZOOM;
  zoomOutBtn.disabled = zoom <= MIN_ZOOM;
}

function updateCanvasTransform(): void {
  canvasWrapper.style.transform = 
    'translate(-50%, -50%) translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
}

function zoomIn(): void {
  zoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
  updateZoomDisplay();
  updateCanvasTransform();
}

function zoomOut(): void {
  zoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
  updateZoomDisplay();
  updateCanvasTransform();
}

function fitToView(): void {
  if (!renderer.isImageLoaded) return;
  
  const containerWidth = canvasContainer.clientWidth - 40;
  const containerHeight = canvasContainer.clientHeight - 40;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  zoom = Math.min(scaleX, scaleY, MAX_ZOOM);
  zoom = Math.max(zoom, MIN_ZOOM);
  panX = 0;
  panY = 0;
  
  updateZoomDisplay();
  updateCanvasTransform();
}

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
  canvasContainer.style.display = 'none';
  zoomControls.style.display = 'none';
  emptyState.innerHTML = '<h2>' + title + '</h2><p>' + message + '</p>';
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
        renderer.setupTexture(img);
        render();
        
        canvasContainer.style.display = 'block';
        zoomControls.style.display = 'flex';
        loading.style.display = 'none';
        
        fitToView();
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

function setupZoomPanHandlers(): void {
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  zoomFitBtn.addEventListener('click', fitToView);
  
  canvasContainer.addEventListener('wheel', function(e: WheelEvent) {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      var rect = canvasContainer.getBoundingClientRect();
      var cursorX = e.clientX - rect.left - rect.width / 2;
      var cursorY = e.clientY - rect.top - rect.height / 2;
      
      var zoomFactor = 0.01;
      var delta = -e.deltaY * zoomFactor;
      var oldZoom = zoom;
      
      zoom = zoom * (1 + delta);
      zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
      
      var zoomRatio = zoom / oldZoom;
      panX = cursorX - (cursorX - panX) * zoomRatio;
      panY = cursorY - (cursorY - panY) * zoomRatio;
      
      updateZoomDisplay();
      updateCanvasTransform();
    } else {
      panX -= e.deltaX;
      panY -= e.deltaY;
      updateCanvasTransform();
    }
  });
  
  canvasContainer.addEventListener('mousedown', function(e: MouseEvent) {
    if (e.button === 0) {
      isPanning = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvasContainer.style.cursor = 'grabbing';
    }
  });
  
  document.addEventListener('mousemove', function(e: MouseEvent) {
    if (isPanning) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      panX += dx;
      panY += dy;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      updateCanvasTransform();
    }
  });
  
  document.addEventListener('mouseup', function() {
    if (isPanning) {
      isPanning = false;
      canvasContainer.style.cursor = 'grab';
    }
  });
}

function setupResizeObserver(): void {
  const resizeObserver = new ResizeObserver(function() {
    if (renderer.isImageLoaded) {
      updateCanvasTransform();
    }
  });
  resizeObserver.observe(mainArea);
}

function init(): void {
  if (!renderer.init()) {
    showMessage('WebGL not supported', 'This plugin requires WebGL. Please try a different browser.');
    return;
  }

  setupControls(render);
  setupZoomPanHandlers();
  setupResizeObserver();

  (window as any).applyHalftone = applyHalftone;
  (window as any).cancel = cancel;
  (window as any).resetDefaults = function() { resetDefaults(render); };

  window.onmessage = function(event: MessageEvent) {
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

