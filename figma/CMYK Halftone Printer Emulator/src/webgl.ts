import vertexShaderSource from '@shared/shaders/halftone-vertex.glsl';
import fragmentShaderSource from '@shared/shaders/halftone-fragment.glsl';
import type { HalftoneSettings } from './constants';

interface WebGLUniforms {
  u_texture: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_frequency: WebGLUniformLocation | null;
  u_dotSize: WebGLUniformLocation | null;
  u_roughness: WebGLUniformLocation | null;
  u_fuzz: WebGLUniformLocation | null;
  u_paperNoise: WebGLUniformLocation | null;
  u_inkNoise: WebGLUniformLocation | null;
  u_randomness: WebGLUniformLocation | null;
  u_contrast: WebGLUniformLocation | null;
  u_lightness: WebGLUniformLocation | null;
  u_blur: WebGLUniformLocation | null;
  u_threshold: WebGLUniformLocation | null;
  u_paperColor: WebGLUniformLocation | null;
  u_cyanAngle: WebGLUniformLocation | null;
  u_magentaAngle: WebGLUniformLocation | null;
  u_yellowAngle: WebGLUniformLocation | null;
  u_blackAngle: WebGLUniformLocation | null;
  u_cyanColor: WebGLUniformLocation | null;
  u_magentaColor: WebGLUniformLocation | null;
  u_yellowColor: WebGLUniformLocation | null;
  u_blackColor: WebGLUniformLocation | null;
  u_showCyan: WebGLUniformLocation | null;
  u_showMagenta: WebGLUniformLocation | null;
  u_showYellow: WebGLUniformLocation | null;
  u_showBlack: WebGLUniformLocation | null;
  u_blendMode: WebGLUniformLocation | null;
}

export class HalftoneRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private uniforms: WebGLUniforms | null = null;
  private canvas: HTMLCanvasElement;
  
  public imageWidth = 0;
  public imageHeight = 0;
  public isImageLoaded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(): boolean {
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true }) as WebGLRenderingContext | null;
    
    if (!this.gl) {
      console.error('WebGL not supported');
      return false;
    }

    // Enable derivatives extension for anti-aliasing
    this.gl.getExtension('OES_standard_derivatives');

    // Create shaders
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return false;
    }

    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) return false;
    
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return false;
    }

    // Get uniform locations
    this.uniforms = {
      u_texture: this.gl.getUniformLocation(this.program, 'u_texture'),
      u_resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      u_frequency: this.gl.getUniformLocation(this.program, 'u_frequency'),
      u_dotSize: this.gl.getUniformLocation(this.program, 'u_dotSize'),
      u_roughness: this.gl.getUniformLocation(this.program, 'u_roughness'),
      u_fuzz: this.gl.getUniformLocation(this.program, 'u_fuzz'),
      u_paperNoise: this.gl.getUniformLocation(this.program, 'u_paperNoise'),
      u_inkNoise: this.gl.getUniformLocation(this.program, 'u_inkNoise'),
      u_randomness: this.gl.getUniformLocation(this.program, 'u_randomness'),
      u_contrast: this.gl.getUniformLocation(this.program, 'u_contrast'),
      u_lightness: this.gl.getUniformLocation(this.program, 'u_lightness'),
      u_blur: this.gl.getUniformLocation(this.program, 'u_blur'),
      u_threshold: this.gl.getUniformLocation(this.program, 'u_threshold'),
      u_paperColor: this.gl.getUniformLocation(this.program, 'u_paperColor'),
      u_cyanAngle: this.gl.getUniformLocation(this.program, 'u_cyanAngle'),
      u_magentaAngle: this.gl.getUniformLocation(this.program, 'u_magentaAngle'),
      u_yellowAngle: this.gl.getUniformLocation(this.program, 'u_yellowAngle'),
      u_blackAngle: this.gl.getUniformLocation(this.program, 'u_blackAngle'),
      u_cyanColor: this.gl.getUniformLocation(this.program, 'u_cyanColor'),
      u_magentaColor: this.gl.getUniformLocation(this.program, 'u_magentaColor'),
      u_yellowColor: this.gl.getUniformLocation(this.program, 'u_yellowColor'),
      u_blackColor: this.gl.getUniformLocation(this.program, 'u_blackColor'),
      u_showCyan: this.gl.getUniformLocation(this.program, 'u_showCyan'),
      u_showMagenta: this.gl.getUniformLocation(this.program, 'u_showMagenta'),
      u_showYellow: this.gl.getUniformLocation(this.program, 'u_showYellow'),
      u_showBlack: this.gl.getUniformLocation(this.program, 'u_showBlack'),
      u_blendMode: this.gl.getUniformLocation(this.program, 'u_blendMode')
    };

    // Create vertex buffer
    const vertices = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Set up attributes
    const positionLoc = this.gl.getAttribLocation(this.program, 'a_position');
    const texCoordLoc = this.gl.getAttribLocation(this.program, 'a_texCoord');

    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.enableVertexAttribArray(texCoordLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.vertexAttribPointer(texCoordLoc, 2, this.gl.FLOAT, false, 16, 8);

    return true;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  async loadImageFromBytes(bytes: Uint8Array): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  setupTexture(img: HTMLImageElement): void {
    if (!this.gl) return;

    if (this.texture) {
      this.gl.deleteTexture(this.texture);
    }

    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

    console.log('Image dimensions:', img.width, 'x', img.height);
    console.log('Natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);

    this.imageWidth = img.width;
    this.imageHeight = img.height;

    // Set canvas to actual image size - zoom controls handle display scaling
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.canvas.style.width = img.width + 'px';
    this.canvas.style.height = img.height + 'px';
    
    console.log('Canvas set to:', this.canvas.width, 'x', this.canvas.height);
    
    this.gl.viewport(0, 0, img.width, img.height);
    this.isImageLoaded = true;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  render(settings: HalftoneSettings): void {
    if (!this.gl || !this.program || !this.texture || !this.uniforms || !this.isImageLoaded) return;

    this.gl.useProgram(this.program);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    // Set uniforms
    this.gl.uniform1i(this.uniforms.u_texture, 0);
    this.gl.uniform2f(this.uniforms.u_resolution, this.imageWidth, this.imageHeight);
    this.gl.uniform1f(this.uniforms.u_frequency, settings.frequency);
    this.gl.uniform1f(this.uniforms.u_dotSize, settings.dotSize);
    this.gl.uniform1f(this.uniforms.u_roughness, settings.roughness);
    this.gl.uniform1f(this.uniforms.u_fuzz, settings.fuzz);
    this.gl.uniform1f(this.uniforms.u_paperNoise, settings.paperNoise);
    this.gl.uniform1f(this.uniforms.u_inkNoise, settings.inkNoise);
    this.gl.uniform1f(this.uniforms.u_randomness, settings.randomness);
    this.gl.uniform1f(this.uniforms.u_contrast, settings.contrast);
    this.gl.uniform1f(this.uniforms.u_lightness, settings.lightness);
    this.gl.uniform1f(this.uniforms.u_blur, settings.blur);
    this.gl.uniform1f(this.uniforms.u_threshold, settings.threshold);

    const paperRgb = this.hexToRgb(settings.paperColor);
    this.gl.uniform3f(this.uniforms.u_paperColor, paperRgb[0], paperRgb[1], paperRgb[2]);

    this.gl.uniform1f(this.uniforms.u_cyanAngle, settings.cyanAngle);
    this.gl.uniform1f(this.uniforms.u_magentaAngle, settings.magentaAngle);
    this.gl.uniform1f(this.uniforms.u_yellowAngle, settings.yellowAngle);
    this.gl.uniform1f(this.uniforms.u_blackAngle, settings.blackAngle);

    const cyanRgb = this.hexToRgb(settings.cyanInk);
    this.gl.uniform4f(this.uniforms.u_cyanColor, cyanRgb[0], cyanRgb[1], cyanRgb[2], settings.cyanAlpha);
    
    const magentaRgb = this.hexToRgb(settings.magentaInk);
    this.gl.uniform4f(this.uniforms.u_magentaColor, magentaRgb[0], magentaRgb[1], magentaRgb[2], settings.magentaAlpha);
    
    const yellowRgb = this.hexToRgb(settings.yellowInk);
    this.gl.uniform4f(this.uniforms.u_yellowColor, yellowRgb[0], yellowRgb[1], yellowRgb[2], settings.yellowAlpha);
    
    const blackRgb = this.hexToRgb(settings.blackInk);
    this.gl.uniform4f(this.uniforms.u_blackColor, blackRgb[0], blackRgb[1], blackRgb[2], settings.blackAlpha);

    this.gl.uniform1i(this.uniforms.u_showCyan, settings.showCyan ? 1 : 0);
    this.gl.uniform1i(this.uniforms.u_showMagenta, settings.showMagenta ? 1 : 0);
    this.gl.uniform1i(this.uniforms.u_showYellow, settings.showYellow ? 1 : 0);
    this.gl.uniform1i(this.uniforms.u_showBlack, settings.showBlack ? 1 : 0);
    this.gl.uniform1i(this.uniforms.u_blendMode, settings.blendMode);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  getImageBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    });
  }
}

