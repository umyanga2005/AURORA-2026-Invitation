import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import flameVertexShader from '../../shaders/flameVertex.glsl?raw';
import flameFragmentShader from '../../shaders/flameFragment.glsl?raw';
import { LAMP_METADATA } from '../../assets/lampMetadata';
import { imageNormToWorld, type PlaneTransform } from '../../assets/lampMasks';
import type { ProgressiveIgnitionController } from '../../engine/IgnitionController';

interface FlameRendererProps {
  plane: PlaneTransform;
  controller: ProgressiveIgnitionController;
}

interface LayerConfig {
  seed: number;
  alpha: number;
  widthScale: number;
  heightScale: number;
  zOffset: number;
  renderOrder: number;
}

const FLAME_LAYERS: LayerConfig[] = [
  { seed: 1.13, alpha: 0.85, widthScale: 1.04, heightScale: 1.0, zOffset: 0.04, renderOrder: 4 },
  { seed: 4.71, alpha: 0.72, widthScale: 0.88, heightScale: 1.12, zOffset: 0.05, renderOrder: 5 },
  { seed: 9.37, alpha: 0.52, widthScale: 0.72, heightScale: 0.92, zOffset: 0.06, renderOrder: 6 },
];

export function FlameRenderer({ plane, controller }: FlameRendererProps) {
  // Anchor the flame base inside the bowl opening just behind the front rim lip
  const baseWorld = useMemo(() => {
    return imageNormToWorld(
      LAMP_METADATA.bowlOpening.centerX,
      LAMP_METADATA.bowlOpening.frontEdgeY - -0.04,
      plane
    );
  }, [plane]);

  // Span the full bowl opening width with room for lateral organic wisps
  const baseWidth = plane.width * LAMP_METADATA.bowlOpening.radiusX * 3.5;
  // Tall ceremonial flame height reaching cleanly into the upper viewport
  const maxFlameHeight = plane.height * 1.6;

  const materials = useMemo(() => {
    return FLAME_LAYERS.map(
      (layer) =>
        new THREE.ShaderMaterial({
          vertexShader: flameVertexShader,
          fragmentShader: flameFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uHeight: { value: 0 },
            uIntensity: { value: 0 },
            uLayerSeed: { value: layer.seed },
            uLayerAlpha: { value: layer.alpha },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
    );
  }, []);

  useEffect(() => {
    return () => {
      materials.forEach((mat) => mat.dispose());
    };
  }, [materials]);

  useFrame(() => {
    const elapsed = controller.clock.getElapsed();
    const flameState = controller.flame.getState();
    for (const mat of materials) {
      mat.uniforms.uTime.value = elapsed;
      mat.uniforms.uHeight.value = flameState.currentHeight;
      mat.uniforms.uIntensity.value = flameState.currentIntensity;
    }
  });

  return (
    <group>
      {FLAME_LAYERS.map((layer, idx) => {
        const w = baseWidth * layer.widthScale;
        const h = maxFlameHeight * layer.heightScale;
        return (
          <mesh
            key={layer.seed}
            position={[baseWorld.x, baseWorld.y + h * 0.5, layer.zOffset]}
            renderOrder={layer.renderOrder}
            material={materials[idx]}
          >
            <planeGeometry args={[w, h]} />
          </mesh>
        );
      })}
    </group>
  );
}
