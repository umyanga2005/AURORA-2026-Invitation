uniform float uTime;
uniform float uHeight;
uniform float uIntensity;
uniform float uLayerSeed;
uniform float uLayerAlpha;

uniform vec3 uColGlow;
uniform vec3 uColOuter;
uniform vec3 uColMid;
uniform vec3 uColInner;
uniform vec3 uColCore;

varying vec2 vUv;

// 2D hash & gradient-like value noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = rot * p * 2.04 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return v;
}

void main() {
  if (uHeight <= 0.002 || uIntensity <= 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float t = uTime * 1.35 + uLayerSeed * 17.3;

  // Map UV: x in [-1, 1], y in [0, 1] from bowl base upward
  float x = (vUv.x - 0.5) * 2.0;
  // Scale vertical coordinate inversely with uHeight so lower heights stay shorter & grounded
  float effectiveHeight = mix(0.24, 1.0, pow(uHeight, 0.85));
  float y = vUv.y / effectiveHeight;

  // Soft discard above effective height
  if (y > 1.18) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Natural sway & bend increasing with altitude
  float sway = sin(t * 1.7 + y * 3.5 + uLayerSeed * 4.0) * 0.08 * pow(y, 1.2)
             + sin(t * 3.1 - y * 5.0) * 0.035 * y;

  // Domain warping for turbulent tongues that split & rejoin
  vec2 warpUv = vec2(x * 2.1 + sway, y * 2.6 - t * 1.85);
  float warpX = (fbm(warpUv + vec2(0.0, uLayerSeed)) - 0.5) * (0.45 + 0.55 * y);
  float warpY = (fbm(warpUv * 1.4 + vec2(5.2, 1.3)) - 0.5) * 0.35;

  // Multi-tongue horizontal profile: wide across bowl opening at base, tapering organically
  float baseHalfWidth = mix(0.38, 0.52, uHeight);
  float taper = pow(max(0.0, 1.0 - y * 0.88), 0.72);
  float halfWidth = baseHalfWidth * taper + 0.035;

  // Distance from warped flame spine
  float dx = (x - sway + warpX * 0.42) / max(0.05, halfWidth);

  // Fine high-frequency lick turbulence for irregular tips & split tongues
  float n1 = fbm(vec2(x * 3.6 + warpX * 1.6, y * 4.2 - t * 2.6));
  float n2 = fbm(vec2(x * 7.2 - warpX * 1.2, y * 7.5 - t * 4.1));
  float turb = n1 * 0.68 + n2 * 0.32;

  // Secondary side-tongues emerging from the wide bowl opening
  float tongueField = fbm(vec2(x * 4.8 + uLayerSeed * 3.1, y * 2.8 - t * 2.2));
  float tongueBoost = smoothstep(0.45, 0.78, tongueField) * (1.0 - y) * 0.35;

  // Core flame density field
  float radial = 1.0 - dx * dx;
  float verticalFade = smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.62, 1.05, y + warpY * 0.45));
  float density = (radial + tongueBoost + (turb - 0.46) * 0.92) * verticalFade;

  // Internal dark pockets & bright filaments (authentic photographic fire texture)
  float pocket = smoothstep(0.28, 0.72, n2);
  density *= mix(0.72, 1.18, pocket);

  // Soften outer boundary with no hard edge
  float flameMask = smoothstep(0.12, 0.78, density);
  if (flameMask <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Temperature mapping from core to outer wisps
  float temp = clamp(density * (0.72 + 0.55 * uIntensity), 0.0, 1.35);
  // Extra hot bright core near the center-lower bowl opening
  float coreHotspot = exp(-dx * dx * 2.8) * (1.0 - smoothstep(0.05, 0.65, y)) * uIntensity;
  temp += coreHotspot * 0.38;

  // Color ramp based on temperature
  vec3 color = uColGlow;
  color = mix(color, uColOuter, smoothstep(0.10, 0.35, temp));
  color = mix(color, uColMid,   smoothstep(0.35, 0.65, temp));
  color = mix(color, uColInner, smoothstep(0.62, 0.92, temp));
  color = mix(color, uColCore,  smoothstep(0.88, 1.22, temp));

  // Controlled emissive multiplier (keeps bloom rich without blowing out gold)
  float energy = (0.65 + 1.15 * uIntensity) * uLayerAlpha;
  float alpha = clamp(flameMask * (0.55 + 0.45 * uIntensity) * uLayerAlpha, 0.0, 1.0);

  // Smooth horizontal edge vignette so UV quad boundaries are never visible
  float edgeX = 1.0 - smoothstep(0.75, 0.98, abs(x));
  alpha *= edgeX;

  gl_FragColor = vec4(color * energy * alpha, alpha);
}
