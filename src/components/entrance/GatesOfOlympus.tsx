import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../engine/AudioEngine';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { EntranceState } from '../../types/entrance';
import type { SoundConfig } from '../../types/invitation';
import { EntrancePrompt } from './EntrancePrompt';
import '../../styles/entrance.css';

export function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function useEntranceController(soundConfigRef: React.MutableRefObject<SoundConfig>) {
  const reducedMotion = useReducedMotion();
  const [entranceState, setEntranceState] = useState<EntranceState>('INITIALIZING');
  const hasTriggeredRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Scene 01 & 02: Awakening -> Entrance Ready on fresh page launch
  useEffect(() => {
    const awakenDelay = reducedMotion ? 250 : 1200;
    const t = window.setTimeout(() => {
      setEntranceState((prev) => (prev === 'INITIALIZING' ? 'ENTRANCE_READY' : prev));
    }, awakenDelay);
    timersRef.current.push(t);

    return () => {
      clearTimers();
    };
  }, [reducedMotion, clearTimers]);

  // Scene 04 -> 05 -> 06 -> 07: Visitor Interaction -> Doors Opening -> Light Reveal -> Invitation
  const triggerEnter = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    clearTimers();

    // Unlock audio inside direct user gesture and play emblem chime + distant thunder
    audioEngine.unlock();
    audioEngine.playEntranceEmblemChime(soundConfigRef.current);
    audioEngine.playDistantThunder(soundConfigRef.current);

    setEntranceState('ENTERING');

    const enterDuration = reducedMotion ? 220 : 650;
    const openDuration = reducedMotion ? 800 : 2100;
    const revealDuration = reducedMotion ? 350 : 1050;

    const tOpen = window.setTimeout(() => {
      audioEngine.playHeavyDoorsOpening(soundConfigRef.current);
      setEntranceState('DOORS_OPENING');
    }, enterDuration);

    const tReveal = window.setTimeout(() => {
      audioEngine.playDivineLightReveal(soundConfigRef.current);
      setEntranceState('LIGHT_REVEAL');
    }, enterDuration + openDuration);

    const tComplete = window.setTimeout(() => {
      setEntranceState('INVITATION_VISIBLE');
    }, enterDuration + openDuration + revealDuration);

    timersRef.current.push(tOpen, tReveal, tComplete);
  }, [clearTimers, reducedMotion, soundConfigRef]);

  return {
    entranceState,
    triggerEnter,
  };
}

interface GatesOfOlympusProps {
  entranceState: EntranceState;
  webglSupported: boolean;
  onEnter: () => void;
}

/**
 * Overlay host for The Gates of Olympus:
 * - Renders the accessible EntrancePrompt over the 3D WebGL GoldenGateScene.
 * - If WebGL is unavailable, renders a graceful CSS-3D Golden Gate fallback so visitors are never blocked.
 */
export function GatesOfOlympus({
  entranceState,
  webglSupported,
  onEnter,
}: GatesOfOlympusProps) {
  if (entranceState === 'INVITATION_VISIBLE') return null;

  const isOpeningOrReveal =
    entranceState === 'DOORS_OPENING' || entranceState === 'LIGHT_REVEAL';

  return (
    <div
      className={`gates-host gates-state-${entranceState.toLowerCase()}`}
      role="region"
      aria-label="The Gates of Olympus Entrance"
    >
      {/* Graceful CSS-3D Fallback Gates when WebGL is unavailable */}
      {!webglSupported && (
        <div className="css-gates-fallback" aria-hidden="true">
          <div className={`css-light-seam ${isOpeningOrReveal ? 'seam-open' : ''}`} />
          <div className="css-gates-stage">
            <div className={`css-door css-door-left ${isOpeningOrReveal ? 'door-open-left' : ''}`} />
            <div className={`css-door css-door-right ${isOpeningOrReveal ? 'door-open-right' : ''}`} />
            <div className={`css-gate-medallion ${isOpeningOrReveal ? 'medallion-fade' : ''}`}>
              <img src="/aurora-logo.png" alt="" draggable={false} />
            </div>
          </div>
        </div>
      )}

      {/* Subtle golden flash/bloom mist overlay during LIGHT_REVEAL */}
      <div
        className={`entrance-light-veil ${
          entranceState === 'LIGHT_REVEAL' ? 'veil-active' : ''
        }`}
        aria-hidden="true"
      />

      <EntrancePrompt entranceState={entranceState} onEnter={onEnter} />
    </div>
  );
}
