import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface GateEmblemProps {
  radius: number;
  zOffset: number;
  glowIntensity: number;
  opacity: number;
  scale: number;
}

export function GateEmblem({
  radius,
  zOffset,
  glowIntensity,
  opacity,
  scale,
}: GateEmblemProps) {
  const logoTex = useTexture('/aurora-logo.png');

  useEffect(() => {
    logoTex.colorSpace = THREE.SRGBColorSpace;
    logoTex.needsUpdate = true;
  }, [logoTex]);

  const logoWidth = radius * 1.62;
  const logoHeight = logoWidth / (1024 / 558);

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D6A64B',
        metalness: 0.9,
        roughness: 0.22,
        emissive: '#F4D58A',
        emissiveIntensity: 0.14,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  const innerDiscMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0B0906',
        metalness: 0.45,
        roughness: 0.52,
        emissive: '#A8792A',
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.96,
      }),
    []
  );

  useEffect(() => {
    ringMaterial.emissiveIntensity = 0.14 + glowIntensity * 0.72;
    ringMaterial.opacity = opacity;
    innerDiscMaterial.emissiveIntensity = 0.04 + glowIntensity * 0.35;
    innerDiscMaterial.opacity = opacity * 0.96;
  }, [glowIntensity, opacity, ringMaterial, innerDiscMaterial]);

  useEffect(() => {
    return () => {
      ringMaterial.dispose();
      innerDiscMaterial.dispose();
    };
  }, [ringMaterial, innerDiscMaterial]);

  if (opacity <= 0.01) return null;

  return (
    <group position={[0, 0, zOffset]} scale={[scale, scale, 1]}>
      <mesh renderOrder={25} material={innerDiscMaterial}>
        <circleGeometry args={[radius, 48]} />
      </mesh>
      <mesh position={[0, 0, 0.012]} renderOrder={26} material={ringMaterial}>
        <torusGeometry args={[radius, radius * 0.055, 16, 48]} />
      </mesh>
      <mesh position={[0, 0, 0.014]} renderOrder={26} material={ringMaterial}>
        <torusGeometry args={[radius * 0.87, radius * 0.016, 12, 48]} />
      </mesh>
      <mesh position={[0, 0, 0.025]} renderOrder={27}>
        <planeGeometry args={[logoWidth, logoHeight]} />
        <meshBasicMaterial
          map={logoTex}
          transparent
          opacity={opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
