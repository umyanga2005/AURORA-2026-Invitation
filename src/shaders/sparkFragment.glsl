uniform float uOpacity;
uniform float uTime;
uniform float uSeed;

uniform vec3 uSparkCore;
uniform vec3 uSparkMid;
uniform vec3 uSparkOuter;

varying vec2 vUv;

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  if (r > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float flicker = 0.88 + 0.12 * sin(uTime * 22.0 + uSeed * 10.0);

  // Tight white-yellow core, golden inner, warm orange halo
  float core = exp(-r * r * 18.0);
  float inner = exp(-r * r * 6.0);
  float outer = exp(-r * r * 2.2) * (1.0 - smoothstep(0.5, 1.0, r));

  vec3 color = uSparkOuter * outer * 1.1 + uSparkMid * inner * 1.5 + uSparkCore * core * 2.2;
  float alpha = clamp((outer * 0.65 + inner * 0.85 + core) * uOpacity * flicker, 0.0, 1.0);

  gl_FragColor = vec4(color * alpha, alpha);
}
