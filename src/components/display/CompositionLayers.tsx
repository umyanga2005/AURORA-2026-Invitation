import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { LAMP_METADATA } from '../../assets/lampMetadata';
import type { PlaneTransform } from '../../assets/lampMasks';
import type { ProgressiveIgnitionController } from '../../engine/IgnitionController';
import type { InvitationPhase } from '../../types/invitation';
import { FlameRenderer } from './FlameRenderer';
import { ImpactEffects } from './ImpactEffects';
import { LampBackLayer, LampFrontLayer, LampInteriorGlow } from './LampImage';
import { SparkRenderer } from './SparkRenderer';

interface CompositionLayersProps {
  controller: ProgressiveIgnitionController;
  createSparkId: () => string;
  phase: InvitationPhase;
  onTouchLamp: () => void;
}

export function CompositionLayers({
  controller,
  createSparkId,
  phase,
  onTouchLamp,
}: CompositionLayersProps) {
  const { viewport } = useThree();
  const flameIntensityRef = useRef(0);
  const lampGroupRef = useRef<THREE.Group>(null);
  const lampSlideOffsetRef = useRef(0);

  // Responsive lamp placement preserving 1536:1024 aspect ratio across
  // Desktop, Tablet Landscape, Tablet Portrait, Mobile Portrait, and Mobile Landscape
  const lampPlane: PlaneTransform = useMemo(() => {
    const aspect = LAMP_METADATA.aspectRatio;
    const isPortrait = viewport.height > viewport.width;
    const isVeryShortLandscape = !isPortrait && viewport.height / Math.max(viewport.width, 0.01) < 0.52;
    const isTabletPortrait = isPortrait && viewport.width / Math.max(viewport.height, 0.01) > 0.58;

    const maxHeightByViewport = viewport.height * (
      isTabletPortrait ? 0.34 :
      isPortrait ? 0.35 :
      isVeryShortLandscape ? 0.52 :
      0.42
    );
    const maxWidthByViewport = viewport.width * (
      isTabletPortrait ? 0.68 :
      isPortrait ? 0.84 :
      isVeryShortLandscape ? 0.44 :
      0.54
    );

    const width = Math.min(maxWidthByViewport, maxHeightByViewport * aspect);
    const height = width / aspect;

    // Position in lower-centre so the bowl sits cleanly below the writing area
    const centerY = -viewport.height * (
      isTabletPortrait ? 0.25 :
      isPortrait ? 0.24 :
      isVeryShortLandscape ? 0.22 :
      0.30
    );

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

  // Reset lamp vertical position whenever returned to EXTINGUISHED
  useEffect(() => {
    if (phase === 'EXTINGUISHED') {
      lampSlideOffsetRef.current = 0;
      if (lampGroupRef.current) {
        lampGroupRef.current.position.y = 0;
        lampGroupRef.current.visible = true;
      }
    }
  }, [phase]);

  useFrame((_, delta) => {
    controller.step(delta, createSparkId);
    flameIntensityRef.current = controller.flame.getState().currentIntensity;

    const shouldHideLamp =
      phase === 'TRANSITIONING' ||
      phase === 'TYPING_INVITATION' ||
      phase === 'COMPLETE';

    const targetY = shouldHideLamp ? -viewport.height * 1.15 : 0;
    const lerpSpeed = shouldHideLamp ? 2.4 : 4.5;
    lampSlideOffsetRef.current = THREE.MathUtils.lerp(
      lampSlideOffsetRef.current,
      targetY,
      1 - Math.exp(-lerpSpeed * Math.min(delta, 0.05))
    );

    if (lampGroupRef.current) {
      lampGroupRef.current.position.y = lampSlideOffsetRef.current;
      // Hide completely once safely past the bottom edge of the screen
      lampGroupRef.current.visible =
        !shouldHideLamp || lampSlideOffsetRef.current > -viewport.height * 1.02;
    }
  });

  const handlePointerOver = () => {
    if (phase === 'EXTINGUISHED') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  const handleLampPointerDown = (e: { stopPropagation: () => void }) => {
    if (phase !== 'EXTINGUISHED') return;
    e.stopPropagation();
    document.body.style.cursor = 'default';
    onTouchLamp();
  };

  return (
    <group>
      <group ref={lampGroupRef}>
        <LampBackLayer plane={lampPlane} />
        <LampInteriorGlow
          plane={lampPlane}
          flameIntensityRef={flameIntensityRef}
          glowColor={controller.flame.getColorPalette().lampGlow}
        />
        <FlameRenderer plane={lampPlane} controller={controller} />
        <ImpactEffects controller={controller} />
        <LampFrontLayer plane={lampPlane} />

        {/* Direct touch/click hit area over the lamp when extinguished (no button needed) */}
        {phase === 'EXTINGUISHED' && (
          <mesh
            position={[lampPlane.centerX, lampPlane.centerY, 0.25]}
            onPointerDown={handleLampPointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <planeGeometry args={[lampPlane.width * 1.05, lampPlane.height * 1.15]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </group>

      <SparkRenderer controller={controller} />
    </group>
  );
}
