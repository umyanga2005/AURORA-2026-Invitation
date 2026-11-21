import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { createEventId, createSyncMessage } from '../../communication/protocol';
import { attachDisplaySync } from '../../communication/synchronization';
import { audioEngine } from '../../engine/AudioEngine';
import { ProgressiveIgnitionController } from '../../engine/IgnitionController';
import { useDisplayStore } from '../../state/displayStore';
import { useInvitationStore } from '../../state/invitationStore';
import type { InvitationPhase } from '../../types/invitation';
import { AmbientSparksOverlay } from './AmbientSparksOverlay';
import { AuroraLogoWriter } from './AuroraLogoWriter';
import { CompositionLayers } from './CompositionLayers';
import { FireTypewriter } from './FireTypewriter';
import '../../styles/display.css';

export function DisplayScene() {
  const channelRef = useRef<ReturnType<typeof attachDisplaySync> | null>(null);
  const setEngineState = useDisplayStore((s) => s.setEngineState);
  const config = useInvitationStore((s) => s.config);
  const soundConfigRef = useRef(config.sound);

  const [phase, setPhase] = useState<InvitationPhase>('EXTINGUISHED');
  const [burstKey, setBurstKey] = useState(0);
  const phaseTimersRef = useRef<number[]>([]);

  useEffect(() => {
    soundConfigRef.current = config.sound;
    audioEngine.updateConfig(config.sound);
  }, [config.sound]);

  const clearPhaseTimers = useCallback(() => {
    phaseTimersRef.current.forEach((id) => window.clearTimeout(id));
    phaseTimersRef.current = [];
  }, []);

  const resetInvitationSequence = useCallback(() => {
    clearPhaseTimers();
    audioEngine.stopFireCrackle();
    setPhase('EXTINGUISHED');
  }, [clearPhaseTimers]);

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
    // Ensure flame is always extinguished on page load / refresh
    controller.reset(1);
    const sync = attachDisplaySync(controller, {
      onExtinguishOrReset: resetInvitationSequence,
    });
    channelRef.current = sync;
    return () => {
      clearPhaseTimers();
      audioEngine.stopFireCrackle();
      sync.dispose();
      channelRef.current = null;
    };
  }, [controller, resetInvitationSequence, clearPhaseTimers]);

  const createSparkId = useCallback(() => createEventId('spk'), []);

  const handleTouchLamp = useCallback(() => {
    if (phase !== 'EXTINGUISHED') return;
    clearPhaseTimers();

    // Unlock & trigger audio immediately inside user pointer gesture
    audioEngine.unlock();
    audioEngine.playIgnitionWhoosh(soundConfigRef.current);
    audioEngine.startFireCrackle(soundConfigRef.current);

    // Fire up the 3D ceremonial flame and emit celebratory sparks
    controller.triggerFullFlame(1.35);
    setBurstKey((k) => k + 1);
    setPhase('IGNITING');

    // Begin writing AURORA MMXXVI once the flame roars up
    const t1 = window.setTimeout(() => {
      setPhase('WRITING_LOGO');
    }, 1450);
    phaseTimersRef.current.push(t1);
  }, [phase, clearPhaseTimers, controller]);

  const handleWriteTick = useCallback(() => {
    audioEngine.playWritingSpark(soundConfigRef.current);
  }, []);

  const handleLogoWriteComplete = useCallback(() => {
    audioEngine.playLogoCompleteChime(soundConfigRef.current);
    setPhase('TRANSITIONING');

    // Start typing invitation letter-by-letter as logo settles at top & lamp hides below
    const t2 = window.setTimeout(() => {
      setPhase('TYPING_INVITATION');
    }, 1150);
    phaseTimersRef.current.push(t2);
  }, []);

  const handleInvitationComplete = useCallback(() => {
    setPhase('COMPLETE');
  }, []);

  return (
    <div className={`display-root phase-${phase.toLowerCase()}`}>
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
          <CompositionLayers
            controller={controller}
            createSparkId={createSparkId}
            phase={phase}
            onTouchLamp={handleTouchLamp}
          />
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

      {/* Continuous random drifting golden sparks across the entire screen */}
      <AmbientSparksOverlay active={phase !== 'EXTINGUISHED'} burstKey={burstKey} />

      {/* Interactive overlays: Pure vector fire-writing Logo + Boxless letter-by-letter Invitation */}
      <div className="invitation-overlay-root">
        <AuroraLogoWriter
          logoMain={config.text.logoMain}
          logoSub={config.text.logoSub}
          phase={phase}
          onWriteTick={handleWriteTick}
          onLogoWriteComplete={handleLogoWriteComplete}
        />

        <FireTypewriter
          text={config.text}
          phase={phase}
          onTypeTick={handleWriteTick}
          onComplete={handleInvitationComplete}
        />
      </div>
    </div>
  );
}
