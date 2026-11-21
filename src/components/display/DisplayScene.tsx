import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { createEventId, createSyncMessage } from '../../communication/protocol';
import { attachDisplaySync } from '../../communication/synchronization';
import { audioEngine } from '../../engine/AudioEngine';
import { ProgressiveIgnitionController } from '../../engine/IgnitionController';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useDisplayStore } from '../../state/displayStore';
import { useInvitationStore } from '../../state/invitationStore';
import type { InvitationPhase } from '../../types/invitation';
import { AmbientSparksOverlay } from './AmbientSparksOverlay';
import { AuroraLogoWriter } from './AuroraLogoWriter';
import { CompositionLayers } from './CompositionLayers';
import { FireTypewriter } from './FireTypewriter';
import { FullscreenToggle } from './FullscreenToggle';
import '../../styles/display.css';

function detectLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isTouch || cores <= 4;
}

export function DisplayScene() {
  const channelRef = useRef<ReturnType<typeof attachDisplaySync> | null>(null);
  const setEngineState = useDisplayStore((s) => s.setEngineState);
  const config = useInvitationStore((s) => s.config);
  const soundConfigRef = useRef(config.sound);
  const reducedMotion = useReducedMotion();
  const [lowPowerMode] = useState<boolean>(() => detectLowPowerDevice());

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
    // Ensure flame is always extinguished on page load / refresh (no auto-reset timer)
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

  // Unlock Web Audio on any user pointer interaction across the stage
  const handleStagePointerDown = useCallback(() => {
    audioEngine.unlock();
  }, []);

  const handleTouchLamp = useCallback(() => {
    if (phase !== 'EXTINGUISHED') return;
    clearPhaseTimers();

    audioEngine.unlock();
    audioEngine.playIgnitionWhoosh(soundConfigRef.current);
    audioEngine.startFireCrackle(soundConfigRef.current);

    controller.triggerFullFlame(1.35);

    if (reducedMotion) {
      setPhase('COMPLETE');
      return;
    }

    setBurstKey((k) => k + 1);
    setPhase('IGNITING');

    const t1 = window.setTimeout(() => {
      setPhase('WRITING_LOGO');
    }, 1350);
    phaseTimersRef.current.push(t1);
  }, [phase, clearPhaseTimers, controller, reducedMotion]);

  const handleWriteTick = useCallback(() => {
    audioEngine.playWritingSpark(soundConfigRef.current);
  }, []);

  const handleLogoWriteComplete = useCallback(() => {
    audioEngine.playLogoCompleteChime(soundConfigRef.current);
    setPhase('TRANSITIONING');

    const t2 = window.setTimeout(() => {
      setPhase('TYPING_INVITATION');
    }, 950);
    phaseTimersRef.current.push(t2);
  }, []);

  const handleInvitationComplete = useCallback(() => {
    setPhase('COMPLETE');
  }, []);

  const isInvitationDocked =
    phase === 'TRANSITIONING' ||
    phase === 'TYPING_INVITATION' ||
    phase === 'COMPLETE';

  return (
    <div
      className={`display-root phase-${phase.toLowerCase()}`}
      onPointerDown={handleStagePointerDown}
    >
      {/* Subtle warm royal atmospheric backdrop */}
      <div className="royal-atmosphere-bg" aria-hidden="true" />

      {/* Fixed WebGL 3D Ceremonial Lamp & Flame Layer */}
      <div className="webgl-canvas-layer">
        <Canvas
          dpr={lowPowerMode ? [1, 1.5] : [1, 2]}
          camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 50 }}
          gl={{
            antialias: !lowPowerMode,
            powerPreference: 'high-performance',
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
        >
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
              intensity={lowPowerMode ? 0.3 : 0.38}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.25}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Subtle Floating Golden Dust Overlay */}
      <AmbientSparksOverlay
        active={phase !== 'EXTINGUISHED'}
        burstKey={burstKey}
        lowPowerMode={lowPowerMode}
      />

      {/* Discreet Fullscreen Presentation Control (independent of content flow) */}
      <FullscreenToggle />

      {/* Responsive Full-Height Invitation Composition Stage */}
      <main
        className={`invitation-stage-container ${
          isInvitationDocked ? 'stage-docked' : 'stage-lamp-focus'
        }`}
      >
        <div className="invitation-content-column">
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
      </main>
    </div>
  );
}
