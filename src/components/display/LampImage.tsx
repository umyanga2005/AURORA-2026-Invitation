import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { LAMP_METADATA } from '../../assets/lampMetadata';
import { LAMP_MASK_PATHS, type PlaneTransform } from '../../assets/lampMasks';

interface LampLayerProps {
  plane: PlaneTransform;
  flameIntensityRef?: React.MutableRefObject<number>;
}

interface LampInteriorGlowProps extends LampLayerProps {
  glowColor?: [number, number, number];
}

const FRONT_MASK_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRONT_MASK_FRAGMENT = `
uniform sampler2D uMap;
uniform sampler2D uFrontMask;
varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  float mask = texture2D(uFrontMask, vUv).r;
  float alpha = tex.a * mask;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(tex.rgb, alpha);
}
`;

const INTERIOR_GLOW_FRAGMENT = `
uniform sampler2D uOpeningMask;
uniform float uIntensity;
uniform vec3 uGlowColor;
varying vec2 vUv;

void main() {
  if (uIntensity <= 0.005) discard;
  float mask = texture2D(uOpeningMask, vUv).r;
  if (mask < 0.01) discard;
  float alpha = mask * uIntensity * 0.42;
  gl_FragColor = vec4(uGlowColor * alpha, alpha);
}
`;

/**
 * Renders the back/interior of the golden lamp (behind the flame).
 */
export function LampBackLayer({ plane }: LampLayerProps) {
  const lampTex = useTexture(LAMP_METADATA.imagePath);

  useEffect(() => {
    lampTex.colorSpace = THREE.SRGBColorSpace;
    lampTex.needsUpdate = true;
  }, [lampTex]);

  return (
    <mesh position={[plane.centerX, plane.centerY, 0]} renderOrder={1}>
      <planeGeometry args={[plane.width, plane.height]} />
      <meshBasicMaterial
        map={lampTex}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Renders subtle warm firelight inside the bowl opening when lit.
 */
export function LampInteriorGlow({ plane, flameIntensityRef, glowColor }: LampInteriorGlowProps) {
  const openingMask = useTexture(LAMP_MASK_PATHS.bowlOpening);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: FRONT_MASK_VERTEX,
      fragmentShader: INTERIOR_GLOW_FRAGMENT,
      uniforms: {
        uOpeningMask: { value: openingMask },
        uIntensity: { value: 0 },
        uGlowColor: { value: new THREE.Color(1.0, 0.58, 0.12) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [openingMask]);

  useEffect(() => {
    if (glowColor) {
      material.uniforms.uGlowColor.value.setRGB(glowColor[0], glowColor[1], glowColor[2]);
    }
  }, [glowColor, material]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Updated synchronously in parent or via onBeforeRender
  const handleBeforeRender = () => {
    if (flameIntensityRef) {
      material.uniforms.uIntensity.value = flameIntensityRef.current;
    }
  };

  return (
    <mesh
      position={[plane.centerX, plane.centerY, 0.02]}
      renderOrder={3}
      material={material}
      onBeforeRender={handleBeforeRender}
    >
      <planeGeometry args={[plane.width, plane.height]} />
    </mesh>
  );
}

/**
 * Renders the front rim, laurel wreath body, and lower connector IN FRONT of the flame base.
 */
export function LampFrontLayer({ plane }: LampLayerProps) {
  const [lampTex, frontMask] = useTexture([
    LAMP_METADATA.imagePath,
    LAMP_MASK_PATHS.frontRimForeground,
  ]);

  useEffect(() => {
    lampTex.colorSpace = THREE.SRGBColorSpace;
    lampTex.needsUpdate = true;
  }, [lampTex]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: FRONT_MASK_VERTEX,
      fragmentShader: FRONT_MASK_FRAGMENT,
      uniforms: {
        uMap: { value: lampTex },
        uFrontMask: { value: frontMask },
      },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
  }, [lampTex, frontMask]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh position={[plane.centerX, plane.centerY, 0.12]} renderOrder={10} material={material}>
      <planeGeometry args={[plane.width, plane.height]} />
    </mesh>
  );
}
