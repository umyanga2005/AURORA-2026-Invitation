import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { LAMP_METADATA } from '../../assets/lampMetadata';
import type { PlaneTransform } from '../../assets/lampMasks';
import type { ProgressiveIgnitionController } from '../../engine/IgnitionController';
import { FlameRenderer } from './FlameRenderer';
import { ImpactEffects } from './ImpactEffects';
import { LampBackLayer, LampFrontLayer, LampInteriorGlow } from './LampImage';
import { SparkRenderer } from './SparkRenderer';

interface CompositionLayersProps {
  controller: ProgressiveIgnitionController;
  createSparkId: () => string;
}

export function CompositionLayers({ controller, createSparkId }: CompositionLayersProps) {
  const { viewport } = useThree();
  const flameIntensityRef = useRef(0);

  // Responsive lamp placement in lower-centre area, preserving 1536:1024 aspect ratio
  // while leaving generous vertical space above the bowl for a tall ceremonial flame.
  const lampPlane: PlaneTransform = useMemo(() => {
    const aspect = LAMP_METADATA.aspectRatio;
    const maxHeightByViewport = viewport.height * 0.44;
    const maxWidthByViewport = viewport.width * 0.56;
    const width = Math.min(maxWidthByViewport, maxHeightByViewport * aspect);
    const height = width / aspect;

    // Position in lower-centre so the bottom of the lower connector sits near -38% of viewport
    const centerY = -viewport.height * 0.37;

    return {
      centerX: 0,
      centerY,
      width,
      height,
    };
  }, [viewport.width, viewport.height]);

  useEffect(() => {
    controller.setSceneGeometry(
      {
        halfWidth: viewport.width * 0.5,
        halfHeight: viewport.height * 0.5,
      },
      lampPlane
    );
  }, [controller, viewport.width, viewport.height, lampPlane]);

  useFrame((_, delta) => {
    controller.step(delta, createSparkId);
    flameIntensityRef.current = controller.flame.getState().currentIntensity;
  });

  return (
    <group>
      <LampBackLayer plane={lampPlane} />
      <LampInteriorGlow
        plane={lampPlane}
        flameIntensityRef={flameIntensityRef}
        glowColor={controller.flame.getColorPalette().lampGlow}
      />
      <FlameRenderer plane={lampPlane} controller={controller} />
      <SparkRenderer controller={controller} />
      <ImpactEffects controller={controller} />
      <LampFrontLayer plane={lampPlane} />
    </group>
  );
}
