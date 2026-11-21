import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface GoldenLightRevealProps {
  width: number;
  height: number;
  seamIntensity: number;
  revealIntensity: number;
  openProgress: number;
}

const LIGHT_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LIGHT_FRAGMENT = `
uniform float uSeamIntensity;
uniform float uRevealIntensity;
uniform float uOpenProgress;
varying vec2 vUv;

void main() {
  vec2 centered = vUv - vec2(0.5, 0.5);
  float distX = abs(centered.x);
  float distY = abs(centered.y);

  float seamWidth = mix(0.012, 0.16, uOpenProgress);
  float seamBeam = exp(-pow(distX / max(seamWidth, 0.005), 1.8)) * smoothstep(0.52, 0.18, distY);

  float radialDist = length(vec2(centered.x * 1.15, centered.y * 0.9));
  float radialGlow = exp(-radialDist * 3.1) * uRevealIntensity;

  float ray1 = exp(-pow(abs(centered.x - centered.y * 0.28) * 6.0, 2.0)) * 0.35;
  float ray2 = exp(-pow(abs(centered.x + centered.y * 0.24) * 6.5, 2.0)) * 0.3;
  float rays = (ray1 + ray2) * smoothstep(0.55, 0.05, radialDist) * uRevealIntensity;

  float total = seamBeam * uSeamIntensity + radialGlow + rays;
  if (total < 0.004) discard;

  vec3 coreColor = vec3(1.0, 0.95, 0.78);
  vec3 midColor  = vec3(0.95, 0.83, 0.54);
  vec3 outerCol  = vec3(0.84, 0.65, 0.29);

  vec3 col = mix(outerCol, midColor, clamp(total * 1.2, 0.0, 1.0));
  col = mix(col, coreColor, clamp(total * 0.85, 0.0, 1.0));

  float alpha = clamp(total * 0.78, 0.0, 0.88);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export function GoldenLightReveal({
  width,
  height,
  seamIntensity,
  revealIntensity,
  openProgress,
}: GoldenLightRevealProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: LIGHT_VERTEX,
      fragmentShader: LIGHT_FRAGMENT,
      uniforms: {
        uSeamIntensity: { value: 0 },
        uRevealIntensity: { value: 0 },
        uOpenProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    material.uniforms.uSeamIntensity.value = seamIntensity;
    material.uniforms.uRevealIntensity.value = revealIntensity;
    material.uniforms.uOpenProgress.value = openProgress;
  }, [seamIntensity, revealIntensity, openProgress, material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  if (seamIntensity <= 0.005 && revealIntensity <= 0.005) return null;

  return (
    <mesh position={[0, 0, -0.14]} renderOrder={21} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}
