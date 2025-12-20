#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

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

uniform float u_cyanAngle;
uniform float u_magentaAngle;
uniform float u_yellowAngle;
uniform float u_blackAngle;

uniform vec4 u_cyanColor;
uniform vec4 u_magentaColor;
uniform vec4 u_yellowColor;
uniform vec4 u_blackColor;

uniform bool u_showCyan;
uniform bool u_showMagenta;
uniform bool u_showYellow;
uniform bool u_showBlack;

uniform int u_blendMode;

varying vec2 v_texCoord;

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
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec4 rgbToCmyk(vec3 rgb) {
  vec4 cmyk;
  cmyk.w = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
  if (cmyk.w < 1.0) {
    float oneMinusK = 1.0 - cmyk.w;
    cmyk.x = (1.0 - rgb.r - cmyk.w) / oneMinusK;
    cmyk.y = (1.0 - rgb.g - cmyk.w) / oneMinusK;
    cmyk.z = (1.0 - rgb.b - cmyk.w) / oneMinusK;
  } else {
    cmyk.xyz = vec3(0.0);
  }
  return clamp(cmyk, 0.0, 1.0);
}

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

float halftoneChannel(vec2 st, float channelValue, float angle, float roughness, float fuzz, float paperNoise) {
  if (channelValue < u_threshold) {
    return 0.0;
  }
  
  vec2 aspectCorrectedSt = st;
  aspectCorrectedSt.x *= u_resolution.x / u_resolution.y;
  
  vec2 rotatedSt = rotationMatrix(angle) * aspectCorrectedSt * u_frequency;
  
  #ifdef GL_OES_standard_derivatives
  float pixelWidth = length(fwidth(rotatedSt)) * 2.0;
  #else
  float pixelWidth = 0.02;
  #endif
  
  vec2 gridPos = floor(rotatedSt);
  
  if (u_randomness > 0.0) {
    float randX = hash(gridPos) - 0.5;
    float randY = hash(gridPos + vec2(17.0, 31.0)) - 0.5;
    vec2 randomOffset = vec2(randX, randY) * u_randomness * 0.8;
    rotatedSt += randomOffset;
  }
  
  vec2 uv = 2.0 * fract(rotatedSt) - 1.0;
  float intensity = clamp(channelValue, 0.0, 1.0);
  float contrastCurve = intensity * intensity;
  float baseRadius = (contrastCurve * u_dotSize);
  
  if (intensity > 0.1) {
    baseRadius += roughness * paperNoise * intensity;
  }
  
  float dist = length(uv);
  float radius = baseRadius - dist;
  float aaWidth = clamp(pixelWidth, 0.01, 0.1);
  float edge = smoothstep(-fuzz - aaWidth, aaWidth, radius);
  
  return edge;
}

float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma));
}

vec2 pixelateToRotatedGrid(vec2 uv, float freq, float angle) {
  vec2 aspectCorrected = uv;
  aspectCorrected.x *= u_resolution.x / u_resolution.y;
  vec2 rotatedUV = rotationMatrix(angle) * aspectCorrected * freq;
  vec2 cellCenter = floor(rotatedUV) + 0.5;
  mat2 invRotation = rotationMatrix(-angle);
  vec2 unrotated = invRotation * cellCenter / freq;
  unrotated.x /= u_resolution.x / u_resolution.y;
  return unrotated;
}

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

vec3 adjustColor(vec3 color) {
  color = (color - 0.5) * u_contrast + 0.5;
  color = color + u_lightness;
  return clamp(color, 0.0, 1.0);
}

void main() {
  vec2 st = v_texCoord;
  vec3 texcolor = adjustColor(sampleWithBlur(st));
  
  vec2 p = vec2(0.0);
  float s = 100.0;
  float w = 0.5;
  float f = 0.0;
  
  for(int i = 0; i < 4; i++) {
    f += w * simplexNoise(s * vec2(2.0, 1.0) * st);
    w *= 0.55;
    s *= 2.2;
  }
  float paperNoiseValue = 0.1 * f;
  
  vec3 paper = u_paperColor - u_paperNoise * paperNoiseValue;
  float inkamount = 0.9 - u_inkNoise * paperNoiseValue;
  
  vec2 cyanSamplePos = pixelateToRotatedGrid(st, u_frequency, u_cyanAngle);
  vec3 cyanColor = adjustColor(sampleWithBlur(cyanSamplePos));
  vec4 cyanCmyk = rgbToCmyk(cyanColor);
  
  vec2 magentaSamplePos = pixelateToRotatedGrid(st, u_frequency, u_magentaAngle);
  vec3 magentaColor = adjustColor(sampleWithBlur(magentaSamplePos));
  vec4 magentaCmyk = rgbToCmyk(magentaColor);
  
  vec2 yellowSamplePos = pixelateToRotatedGrid(st, u_frequency, u_yellowAngle);
  vec3 yellowColor = adjustColor(sampleWithBlur(yellowSamplePos));
  vec4 yellowCmyk = rgbToCmyk(yellowColor);
  
  vec2 blackSamplePos = pixelateToRotatedGrid(st, u_frequency, u_blackAngle);
  vec3 blackColor = adjustColor(sampleWithBlur(blackSamplePos));
  vec4 blackCmyk = rgbToCmyk(blackColor);
  
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
  
  vec3 rgbscreen = paper;
  
  if (u_showCyan && c > 0.0) {
    vec3 cyanInk = u_cyanColor.rgb;
    float cyanAlpha = u_cyanColor.a * c * inkamount;
    if (u_blendMode == 0) {
      rgbscreen = mix(rgbscreen, rgbscreen * cyanInk, cyanAlpha);
    } else if (u_blendMode == 1) {
      rgbscreen = clamp(rgbscreen + cyanInk * cyanAlpha, 0.0, 1.0);
    } else {
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
  
  #ifdef GL_OES_standard_derivatives
  float afwidth = 2.0 * u_frequency * max(length(dFdx(st)), length(dFdy(st)));
  float blend = smoothstep(0.7, 1.4, afwidth);
  #else
  float blend = 0.0;
  #endif
  
  vec3 finalColor = mix(rgbscreen, texcolor, blend);
  gl_FragColor = vec4(finalColor, 1.0);
}

