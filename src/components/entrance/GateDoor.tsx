import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createGreekDoorTextures } from './gateTextures';

interface GateDoorProps {
  side: 'left' | 'right';
  doorWidth: number;
  doorHeight: number;
  doorDepth: number;
  pivotRef: React.RefObject<THREE.Group>;
  emissiveBoost: number;
  opacity: number;
}

export function GateDoor({
  side,
  doorWidth,
  doorHeight,
  doorDepth,
  pivotRef,
  emissiveBoost,
  opacity,
}: GateDoorProps) {
  const textures = useMemo(() => createGreekDoorTextures(side), [side]);

  useEffect(() => {
    return () => {
      textures.dispose();
    };
  }, [textures]);

  const isLeft = side === 'left';
  const pivotX = isLeft ? -doorWidth : doorWidth;
  const panelOffsetX = isLeft ? doorWidth * 0.5 : -doorWidth * 0.5;
  const handleX = isLeft ? doorWidth * 0.76 : -doorWidth * 0.76;
  const trimThickness = Math.max(0.035, doorWidth * 0.038);
  const ringRadius = Math.min(doorWidth * 0.11, doorHeight * 0.042);

  return (
    <group ref={pivotRef} position={[pivotX, 0, 0]}>
      <mesh position={[panelOffsetX, 0, 0]} renderOrder={22}>
        <boxGeometry args={[doorWidth - 0.008, doorHeight, doorDepth]} />
        <meshStandardMaterial
          map={textures.colorMap}
          bumpMap={textures.bumpMap}
          bumpScale={0.035}
          metalness={0.74}
          roughness={0.34}
          emissive="#A8792A"
          emissiveIntensity={0.08 + emissiveBoost * 0.18}
          transparent={opacity < 0.999}
          opacity={opacity}
        />
      </mesh>

      <mesh
        position={[
          isLeft ? doorWidth - trimThickness * 0.65 : -doorWidth + trimThickness * 0.65,
          0,
          doorDepth * 0.52,
        ]}
        renderOrder={23}
      >
        <boxGeometry args={[trimThickness, doorHeight, 0.028]} />
        <meshStandardMaterial
          color="#D6A64B"
          metalness={0.86}
          roughness={0.24}
          emissive="#F4D58A"
          emissiveIntensity={0.06 + emissiveBoost * 0.35}
          transparent={opacity < 0.999}
          opacity={opacity}
        />
      </mesh>

      <group position={[handleX, -doorHeight * 0.02, doorDepth * 0.55]}>
        <mesh rotation={[Math.PI * 0.5, 0, 0]} renderOrder={24}>
          <cylinderGeometry args={[ringRadius * 0.48, ringRadius * 0.58, 0.03, 18]} />
          <meshStandardMaterial
            color="#A8792A"
            metalness={0.85}
            roughness={0.26}
            transparent={opacity < 0.999}
            opacity={opacity}
          />
        </mesh>
        <mesh position={[0, -ringRadius * 0.72, 0.025]} renderOrder={24}>
          <torusGeometry args={[ringRadius, ringRadius * 0.16, 12, 28]} />
          <meshStandardMaterial
            color="#F4D58A"
            metalness={0.9}
            roughness={0.2}
            emissive="#D6A64B"
            emissiveIntensity={0.08 + emissiveBoost * 0.22}
            transparent={opacity < 0.999}
            opacity={opacity}
          />
        </mesh>
      </group>
    </group>
  );
}
