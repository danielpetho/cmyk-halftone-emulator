precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_dotSize;
uniform float u_contrast;
uniform float u_randomness;
uniform float u_inkDistortion;
uniform float u_inkCracks;
uniform vec3 u_backgroundColor;

// CMYK channel controls
uniform float u_cyanDotSize;
uniform float u_magentaDotSize;
uniform float u_yellowDotSize;
uniform float u_blackDotSize;

uniform float u_cyanAngle;
uniform float u_magentaAngle;
uniform float u_yellowAngle;
uniform float u_blackAngle;

uniform vec3 u_cyanColor;
uniform vec3 u_magentaColor;
uniform vec3 u_yellowColor;
uniform vec3 u_blackColor;

// Layer visibility
uniform bool u_showCyan;
uniform bool u_showMagenta;
uniform bool u_showYellow;
uniform bool u_showBlack;

varying vec2 v_texCoord;

// Hash function for pseudo-random numbers
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 758.5453))) * 43758.5453);
}

// Convert RGB to CMYK
vec4 rgbToCmyk(vec3 rgb) {
  float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
  float c = k < 1.0 ? (1.0 - rgb.r - k) / (1.0 - k) : 0.0;
  float m = k < 1.0 ? (1.0 - rgb.g - k) / (1.0 - k) : 0.0;
  float y = k < 1.0 ? (1.0 - rgb.b - k) / (1.0 - k) : 0.0;
  return vec4(c, m, y, k);
}

// Rotate a 2D point
vec2 rotate(vec2 p, float angle) {
  float s = sin(radians(angle));
  float c = cos(radians(angle));
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Create irregular ink dot shape
float createInkDot(vec2 pos, vec2 center, float radius, float distortion, float cracks, float seed) {
  vec2 offset = pos - center;
  float dist = length(offset);
  
  if (dist > radius * 1.5) return 0.0;
  
  // Base circular shape
  float dot = 1.0 - smoothstep(radius * 0.8, radius, dist);
  
  // Add distortion for irregular shape
  if (distortion > 0.0) {
    float angle = atan(offset.y, offset.x);
    float angleSteps = 8.0 + distortion * 4.0;
    float stepSize = 6.28318 / angleSteps;
    
    // Sample multiple angles for irregular edge
    for (float i = 0.0; i < angleSteps; i += 1.0) {
      float sampleAngle = i * stepSize;
      float noise = hash3(vec3(center, seed + i)) - 0.5;
      float radiusVariation = 1.0 + noise * distortion * 0.6;
      
      float angleDiff = abs(angle - sampleAngle);
      angleDiff = min(angleDiff, 6.28318 - angleDiff);
      
      if (angleDiff < stepSize * 0.6) {
        float weight = 1.0 - (angleDiff / (stepSize * 0.6));
        dot *= mix(1.0, radiusVariation, weight * distortion);
      }
    }
  }
  
  // Add cracks/holes
  if (cracks > 0.0 && dist < radius * 0.7) {
    float numCracks = floor(cracks * 6.0 * (radius / 10.0));
    for (float i = 0.0; i < numCracks && i < 20.0; i += 1.0) {
      vec2 crackPos = center + vec2(
        (hash3(vec3(center, seed + i * 3.0)) - 0.5) * radius * 1.4,
        (hash3(vec3(center, seed + i * 3.0 + 1.0)) - 0.5) * radius * 1.4
      );
      
      float crackSize = hash3(vec3(center, seed + i * 3.0 + 2.0)) * cracks * radius * 0.15;
      float crackDist = length(pos - crackPos);
      
      if (crackDist < crackSize) {
        dot *= 1.0 - smoothstep(0.0, crackSize, crackSize - crackDist);
      }
    }
  }
  
  return clamp(dot, 0.0, 1.0);
}

// Generate halftone for a single channel
float halftoneChannel(vec2 coord, float channelValue, float angle, float dotSize, float seed) {
  float spacing = dotSize * 1.2;
  
  // Rotate coordinate system
  vec2 rotatedCoord = rotate(coord * u_resolution, angle);
  
  // Add randomness offset
  vec2 randomOffset = vec2(0.0);
  if (u_randomness > 0.0) {
    vec2 gridPos = floor(rotatedCoord / spacing);
    randomOffset = vec2(
      (hash(gridPos + seed) - 0.5) * u_randomness * spacing * 0.3,
      (hash(gridPos + seed + 100.0) - 0.5) * u_randomness * spacing * 0.3
    );
  }
  
  // Calculate grid position
  vec2 adjustedCoord = rotatedCoord + randomOffset;
  vec2 gridPos = floor(adjustedCoord / spacing);
  vec2 cellCenter = (gridPos + 0.5) * spacing;
  
  // Calculate dot radius based on channel intensity
  float intensity = channelValue * u_contrast;
  float radius = (intensity * dotSize) * 0.5;
  
  if (radius < 0.5) return 0.0;
  
  // Create ink dot
  vec2 pixelPos = adjustedCoord;
  float dotSeed = hash(gridPos + vec2(seed * 100.0));
  return createInkDot(pixelPos, cellCenter, radius, u_inkDistortion, u_inkCracks, dotSeed);
}

void main() {
  vec2 coord = v_texCoord;
  vec3 originalColor = texture2D(u_texture, coord).rgb;
  
  // Convert to CMYK
  vec4 cmyk = rgbToCmyk(originalColor);
  
  // Start with background color
  vec3 finalColor = u_backgroundColor;
  
  // Apply each channel using multiply blend mode
  if (u_showCyan && cmyk.x > 0.01) {
    float cyanDot = halftoneChannel(coord, cmyk.x, u_cyanAngle, u_cyanDotSize, 1.0);
    vec3 cyanLayer = mix(vec3(1.0), u_cyanColor, cyanDot);
    finalColor *= cyanLayer;
  }
  
  if (u_showMagenta && cmyk.y > 0.01) {
    float magentaDot = halftoneChannel(coord, cmyk.y, u_magentaAngle, u_magentaDotSize, 2.0);
    vec3 magentaLayer = mix(vec3(1.0), u_magentaColor, magentaDot);
    finalColor *= magentaLayer;
  }
  
  if (u_showYellow && cmyk.z > 0.01) {
    float yellowDot = halftoneChannel(coord, cmyk.z, u_yellowAngle, u_yellowDotSize, 3.0);
    vec3 yellowLayer = mix(vec3(1.0), u_yellowColor, yellowDot);
    finalColor *= yellowLayer;
  }
  
  if (u_showBlack && cmyk.w > 0.01) {
    float blackDot = halftoneChannel(coord, cmyk.w, u_blackAngle, u_blackDotSize, 4.0);
    vec3 blackLayer = mix(vec3(1.0), u_blackColor, blackDot);
    finalColor *= blackLayer;
  }
  
  gl_FragColor = vec4(finalColor, 1.0);
}