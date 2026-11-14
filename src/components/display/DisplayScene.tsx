import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { createEventId, createSyncMessage } from '../../communication/protocol';
import { attachDisplaySync } from '../../communication/synchronization';
import { ProgressiveIgnitionController } from '../../engine/IgnitionController';
import { useDisplayStore } from '../../state/displayStore';
import { CompositionLayers } from './CompositionLayers';
import '../../styles/display.css';

export function DisplayScene() {
  const channelRef = useRef<ReturnType<typeof attachDisplaySync> | null>(null);
  const setEngineState = useDisplayStore((s) => s.setEngineState);

  const controller = useMemo(() => {
    return new ProgressiveIgnitionController({
      onSparkStarted: (spark, inFlightSparks) => {
        const ch = channelRef.current?.channel;
        if (!ch) return;
        ch.send(
          createSyncMessage('SPARK_STARTED', 'display', spark.cycleId, {
            sparkId: spark.id,
            inFlightSparks,
          })
        );
      },
      onSparkImpacted: (spark, state) => {
        const ch = channelRef.current?.channel;
        if (!ch) return;
        ch.send(
          createSyncMessage('SPARK_IMPACTED', 'display', state.cycleId, {
            sparkId: spark.id,
            completedSparks: state.completedSparks,
            inFlightSparks: state.inFlightSparks,
            progress: state.progress,
            flameHeight: state.flameHeight,
            flameIntensity: state.flameIntensity,
            status: state.status,
          })
        );
      },
      onStateChanged: (state) => {
        setEngineState(state);
        const ch = channelRef.current?.channel;
        if (!ch) return;
        ch.send(
          createSyncMessage('STATE_SNAPSHOT', 'display', state.cycleId, {
            state,
          })
        );
      },
    });
  }, [setEngineState]);

  useEffect(() => {
    const sync = attachDisplaySync(controller);
    channelRef.current = sync;
    return () => {
      sync.dispose();
      channelRef.current = null;
    };
  }, [controller]);

  const createSparkId = useCallback(() => createEventId('spk'), []);

  return (
    <div className="display-root">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <color attach="background" args={['#000000']} />
        <Suspense fallback={null}>
          <CompositionLayers controller={controller} createSparkId={createSparkId} />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.52}
            luminanceThreshold={0.86}
            luminanceSmoothing={0.22}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
