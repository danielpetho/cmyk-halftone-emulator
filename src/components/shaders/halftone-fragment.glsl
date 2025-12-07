#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

// Halftone parameters
uniform float u_frequency;
uniform float u_dotSize;
uniform float u_roughness;
uniform float u_fuzz;
uniform float u_paperNoise;
uniform float u_inkNoise;
uniform float u_randomness;
uniform float u_contrast;
uniform float u_lightness;
uniform float u_blur;
uniform float u_threshold;
uniform vec3 u_paperColor;

// CMYK channel controls - angles in degrees
uniform float u_cyanAngle;
uniform float u_magentaAngle;
uniform float u_yellowAngle;
uniform float u_blackAngle;

uniform vec4 u_cyanColor;
uniform vec4 u_magentaColor;
uniform vec4 u_yellowColor;
uniform vec4 u_blackColor;

// Layer visibility
uniform bool u_showCyan;
uniform bool u_showMagenta;
uniform bool u_showYellow;
uniform bool u_showBlack;

// Blend mode: 0 = subtractive (multiply), 1 = additive, 2 = normal (alpha blend)
uniform int u_blendMode;

varying vec2 v_texCoord;

// Simplex noise implementation (simplified version of psrdnoise)
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float simplexNoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                  + i.x + vec3(0.0, i1.x, 1.0 ));
  
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Anti-aliased smoothstep with fallback
float aasmoothstep(float edge0, float edge1, float x) {
#ifdef GL_OES_standard_derivatives
  float width = max(fwidth(x), 0.0001);
  return smoothstep(edge0 - width, edge1 + width, x);
#else
  return smoothstep(edge0, edge1, x);
#endif
}

// Anti-aliased step function with fallback
float aastep(float threshold, float value) {
#ifdef GL_OES_standard_derivatives
  float width = max(fwidth(value), 0.0001);
  return smoothstep(threshold - width, threshold + width, value);
#else
  return step(threshold, value);
#endif
}

// Convert RGB to CMYK using proper grey component replacement
vec4 rgbToCmyk(vec3 rgb) {
  // RGB values are already normalized to 0-1 range
  vec4 cmyk;
  
  // Black generation: K = 1 - max(R,G,B)
  cmyk.w = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
  
  // Grey component replacement for CMY channels
  if (cmyk.w < 1.0) {
    float oneMinusK = 1.0 - cmyk.w;
    cmyk.x = (1.0 - rgb.r - cmyk.w) / oneMinusK; // Cyan
    cmyk.y = (1.0 - rgb.g - cmyk.w) / oneMinusK; // Magenta
    cmyk.z = (1.0 - rgb.b - cmyk.w) / oneMinusK; // Yellow
  } else {
    // Pure black case
    cmyk.xyz = vec3(0.0);
  }
  
  // Ensure values are in valid range
  cmyk = clamp(cmyk, 0.0, 1.0);
  
  return cmyk;
}

// Create rotation matrix for given angle in degrees
mat2 rotationMatrix(float angle) {
  float rad = radians(angle);
  float s = sin(rad);
  float c = cos(rad);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return fract(p.x * p.y * (p.x + p.y));
}

// Generate halftone dot for a single channel with custom shapes and random position offsets
float halftoneChannel(vec2 st, float channelValue, float angle, float roughness, float fuzz, float paperNoise) {
  // Apply threshold - if value is below threshold, don't render dot at all
  if (channelValue < u_threshold) {
    return 0.0;
  }
  
  // Apply aspect ratio correction to maintain circular dots
  vec2 aspectCorrectedSt = st;
  aspectCorrectedSt.x *= u_resolution.x / u_resolution.y;
  
  // Rotate coordinate system for screen angle
  vec2 rotatedSt = rotationMatrix(angle) * aspectCorrectedSt * u_frequency;
  
  // Compute stable pixel width BEFORE fract() to avoid discontinuity artifacts
  // fwidth on continuous coords gives the actual pixel footprint
#ifdef GL_OES_standard_derivatives
  float pixelWidth = length(fwidth(rotatedSt)) * 2.0;
#else
  float pixelWidth = 0.02;
#endif
  
  vec2 gridPos = floor(rotatedSt);
  
  // Add randomness to dot positions if enabled
  if (u_randomness > 0.0) {
    // Generate random offsets for each grid cell using hash
    float randX = hash(gridPos) - 0.5;
    float randY = hash(gridPos + vec2(17.0, 31.0)) - 0.5;
    
    // Apply randomness scaling
    vec2 randomOffset = vec2(randX, randY) * u_randomness * 0.8;
    rotatedSt += randomOffset;
  }
  
  // Get local coordinates within grid cell
  vec2 uv = 2.0 * fract(rotatedSt) - 1.0;
  
  // Calculate base intensity and radius with enhanced contrast
  float intensity = clamp(channelValue, 0.0, 1.0);
  
  // Use a power curve to emphasize differences: small values stay small, large values get larger
  float contrastCurve = intensity * intensity; // Square for more dramatic contrast
  
  // Scale dot size with enhanced contrast
  float baseRadius = (contrastCurve * u_dotSize);
  
  // Only add roughness for significant intensities to keep light areas clean
  if (intensity > 0.1) {
    baseRadius += roughness * paperNoise * intensity; // Scale roughness by intensity
  }
  
  // Standard circular dot - distance from center
  float dist = length(uv);
  float radius = baseRadius - dist;
  
  // Use stable pixel width for anti-aliasing
  // Clamp to reasonable range to avoid artifacts
  float aaWidth = clamp(pixelWidth, 0.01, 0.1);
  
  // Simple anti-aliased dot with fuzz
  // radius > 0 means inside the dot
  float edge = smoothstep(-fuzz - aaWidth, aaWidth, radius);
  
  return edge;
}

// Gaussian function for blur weights
float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma));
}

// Pixelate UV coordinates to match a rotated halftone grid
// Each channel needs its own pixelation based on its screen angle
vec2 pixelateToRotatedGrid(vec2 uv, float freq, float angle) {
  // Apply aspect ratio correction (same as in halftoneChannel)
  vec2 aspectCorrected = uv;
  aspectCorrected.x *= u_resolution.x / u_resolution.y;
  
  // Rotate to the channel's screen angle
  vec2 rotatedUV = rotationMatrix(angle) * aspectCorrected * freq;
  
  // Find cell center in rotated space
  vec2 cellCenter = floor(rotatedUV) + 0.5;
  
  // Rotate back and undo frequency scaling
  mat2 invRotation = rotationMatrix(-angle);
  vec2 unrotated = invRotation * cellCenter / freq;
  
  // Undo aspect ratio correction
  unrotated.x /= u_resolution.x / u_resolution.y;
  
  return unrotated;
}

// Sample texture with optional blur at a specific position
vec3 sampleWithBlur(vec2 samplePos) {
  if (u_blur > 0.1) {
    vec2 texelSize = 1.0 / u_resolution;
    float sigma = u_blur / 3.0;
    
    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;
    
    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        vec2 offset = vec2(float(x), float(y)) * texelSize * (u_blur / 4.0);
        float dist = length(vec2(float(x), float(y)));
        float weight = gaussian(dist, sigma);
        
        if (weight > 0.001) {
          colorSum += texture2D(u_texture, samplePos + offset).rgb * weight;
          weightSum += weight;
        }
      }
    }
    
    return colorSum / weightSum;
  } else {
    return texture2D(u_texture, samplePos).rgb;
  }
}

// Apply contrast and lightness adjustments
vec3 adjustColor(vec3 color) {
  color = (color - 0.5) * u_contrast + 0.5;
  color = color + u_lightness;
  return clamp(color, 0.0, 1.0);
}

void main() {
  vec2 st = v_texCoord;
  
  // Sample for display/blending purposes (non-pixelated for smooth result)
  vec3 texcolor = adjustColor(sampleWithBlur(st));
  
  // Generate fractal noise for paper texture
  vec2 p = vec2(0.0);
  float s = 100.0; // Scale for the "paper fibers" texture
  float w = 0.5;
  float f = 0.0;
  vec2 g = vec2(0.0);
  
  // 4 octaves of fractal noise (reduced from 6 for performance)
  for(int i = 0; i < 4; i++) {
    f += w * simplexNoise(s * vec2(2.0, 1.0) * st);
    w *= 0.55;
    s *= 2.2;
  }
  float paperNoiseValue = 0.1 * f + 0.05 * length(g);
  
  // Paper and ink colors with noise
  vec3 paper = u_paperColor - u_paperNoise * paperNoiseValue;
  float inkamount = 0.9 - u_inkNoise * paperNoiseValue;
  
  // For each channel, sample at grid-aligned position with that channel's angle
  // This ensures consistent dot sizes within each rotated halftone cell
  
  // Cyan channel - pixelate to cyan's rotated grid
  vec2 cyanSamplePos = pixelateToRotatedGrid(st, u_frequency, u_cyanAngle);
  vec3 cyanColor = adjustColor(sampleWithBlur(cyanSamplePos));
  vec4 cyanCmyk = rgbToCmyk(cyanColor);
  
  // Magenta channel - pixelate to magenta's rotated grid
  vec2 magentaSamplePos = pixelateToRotatedGrid(st, u_frequency, u_magentaAngle);
  vec3 magentaColor = adjustColor(sampleWithBlur(magentaSamplePos));
  vec4 magentaCmyk = rgbToCmyk(magentaColor);
  
  // Yellow channel - pixelate to yellow's rotated grid
  vec2 yellowSamplePos = pixelateToRotatedGrid(st, u_frequency, u_yellowAngle);
  vec3 yellowColor = adjustColor(sampleWithBlur(yellowSamplePos));
  vec4 yellowCmyk = rgbToCmyk(yellowColor);
  
  // Black channel - pixelate to black's rotated grid
  vec2 blackSamplePos = pixelateToRotatedGrid(st, u_frequency, u_blackAngle);
  vec3 blackColor = adjustColor(sampleWithBlur(blackSamplePos));
  vec4 blackCmyk = rgbToCmyk(blackColor);
  
  // Generate halftone dots for each channel
  // Each channel uses its own grid-aligned CMYK sample for consistent dots
  float c = 0.0, m = 0.0, y = 0.0, k = 0.0;
  
  if (u_showCyan && cyanCmyk.x > 0.001) {
    c = halftoneChannel(st, cyanCmyk.x, u_cyanAngle, u_roughness, u_fuzz, paperNoiseValue);
  }
  
  if (u_showMagenta && magentaCmyk.y > 0.001) {
    m = halftoneChannel(st, magentaCmyk.y, u_magentaAngle, u_roughness, u_fuzz, paperNoiseValue);
  }
  
  if (u_showYellow && yellowCmyk.z > 0.001) {
    y = halftoneChannel(st, yellowCmyk.z, u_yellowAngle, u_roughness, u_fuzz, paperNoiseValue);
  }
  
  if (u_showBlack && blackCmyk.w > 0.001) {
    k = halftoneChannel(st, blackCmyk.w, u_blackAngle, u_roughness, u_fuzz, paperNoiseValue);
  }
  
  // Start with paper color
  vec3 rgbscreen = paper;
  
  // Apply each ink layer with selected blend mode
  if (u_showCyan && c > 0.0) {
    vec3 cyanInk = u_cyanColor.rgb;
    float cyanAlpha = u_cyanColor.a * c * inkamount;
    
    if (u_blendMode == 0) {
      // Subtractive (multiply) - traditional CMYK
      rgbscreen = mix(rgbscreen, rgbscreen * cyanInk, cyanAlpha);
    } else if (u_blendMode == 1) {
      // Additive - for light inks on dark backgrounds
      rgbscreen = clamp(rgbscreen + cyanInk * cyanAlpha, 0.0, 1.0);
    } else {
      // Normal (alpha blend) - most flexible
      rgbscreen = mix(rgbscreen, cyanInk, cyanAlpha);
    }
  }
  
  if (u_showMagenta && m > 0.0) {
    vec3 magentaInk = u_magentaColor.rgb;
    float magentaAlpha = u_magentaColor.a * m * inkamount;
    
    if (u_blendMode == 0) {
      rgbscreen = mix(rgbscreen, rgbscreen * magentaInk, magentaAlpha);
    } else if (u_blendMode == 1) {
      rgbscreen = clamp(rgbscreen + magentaInk * magentaAlpha, 0.0, 1.0);
    } else {
      rgbscreen = mix(rgbscreen, magentaInk, magentaAlpha);
    }
  }
  
  if (u_showYellow && y > 0.0) {
    vec3 yellowInk = u_yellowColor.rgb;
    float yellowAlpha = u_yellowColor.a * y * inkamount;
    
    if (u_blendMode == 0) {
      rgbscreen = mix(rgbscreen, rgbscreen * yellowInk, yellowAlpha);
    } else if (u_blendMode == 1) {
      rgbscreen = clamp(rgbscreen + yellowInk * yellowAlpha, 0.0, 1.0);
    } else {
      rgbscreen = mix(rgbscreen, yellowInk, yellowAlpha);
    }
  }
  
  if (u_showBlack && k > 0.0) {
    vec3 blackInk = u_blackColor.rgb;
    float blackAlpha = u_blackColor.a * k * inkamount;
    
    if (u_blendMode == 0) {
      rgbscreen = mix(rgbscreen, rgbscreen * blackInk, blackAlpha);
    } else if (u_blendMode == 1) {
      rgbscreen = clamp(rgbscreen + blackInk * blackAlpha, 0.0, 1.0);
    } else {
      rgbscreen = mix(rgbscreen, blackInk, blackAlpha);
    }
  }
  
  // Blend to plain RGB texture under extreme minification (with fallback)
#ifdef GL_OES_standard_derivatives
  float afwidth = 2.0 * u_frequency * max(length(dFdx(st)), length(dFdy(st)));
  float blend = smoothstep(0.7, 1.4, afwidth);
#else
  float blend = 0.0; // No blending without derivatives
#endif
  
  vec3 finalColor = mix(rgbscreen, texcolor, blend);
  
  gl_FragColor = vec4(finalColor, 1.0);  
}
