import { useCallback, useEffect, useRef, useState } from 'react';
import { createEventId, createSyncMessage } from '../../communication/protocol';
import { createOperatorSyncClient } from '../../communication/synchronization';
import { FULL_FLAME_TRANSITION_SEC } from '../../config/defaults';
import {
  clamp01,
  clampAutoInterval,
  clampRequiredSparks,
  clampSparkSpeed,
} from '../../config/validation';
import { useOperatorStore } from '../../state/operatorStore';
import type { FlamePresetLevel } from '../../types/flame';
import { DisplayControls } from './DisplayControls';
import { FlameSettings } from './FlameSettings';
import { MainActions } from './MainActions';
import { ProgressIndicator } from './ProgressIndicator';
import { SparkSettings } from './SparkSettings';
import '../../styles/control.css';

export function ControlDashboard() {
  const engineState = useOperatorStore((s) => s.engineState);
  const displayConnected = useOperatorStore((s) => s.displayConnected);
  const clientRef = useRef<ReturnType<typeof createOperatorSyncClient> | null>(null);
  const displayWindowRef = useRef<Window | null>(null);
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null);

  useEffect(() => {
    const client = createOperatorSyncClient();
    clientRef.current = client;
    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  const handleReleaseSpark = useCallback(() => {
    const state = useOperatorStore.getState().engineState;
    if (state.paused || state.status === 'EXTINGUISHING') return;
    if (state.completedSparks + state.inFlightSparks >= state.requiredSparks) return;

    const sparkId = createEventId('spk');
    clientRef.current?.channel.send(
      createSyncMessage('RELEASE_SPARK', 'operator', state.cycleId, {
        sparkId,
        sparkSpeed: state.sparkSpeed,
      })
    );
  }, []);

  const handleToggleAuto = useCallback(() => {
    const store = useOperatorStore.getState();
    const state = store.engineState;
    if (state.autoActive) {
      store.setLocalAutoActive(false);
      clientRef.current?.channel.send(
        createSyncMessage('STOP_AUTO', 'operator', state.cycleId, undefined)
      );
    } else {
      store.setLocalAutoActive(true);
      clientRef.current?.channel.send(
        createSyncMessage('START_AUTO', 'operator', state.cycleId, {
          requiredSparks: state.requiredSparks,
          autoIntervalSec: state.autoIntervalSec,
          sparkSpeed: state.sparkSpeed,
        })
      );
    }
  }, []);

  const handleFullFlame = useCallback(() => {
    const store = useOperatorStore.getState();
    const state = store.engineState;
    store.setLocalAutoActive(false);
    store.setLocalFlamePreset('FULL');
    clientRef.current?.channel.send(
      createSyncMessage('FULL_FLAME', 'operator', state.cycleId, {
        durationSec: FULL_FLAME_TRANSITION_SEC,
      })
    );
  }, []);

  const handleTogglePause = useCallback(() => {
    const store = useOperatorStore.getState();
    const state = store.engineState;
    if (state.paused) {
      store.setLocalPaused(false);
      clientRef.current?.channel.send(
        createSyncMessage('RESUME', 'operator', state.cycleId, undefined)
      );
    } else {
      store.setLocalPaused(true);
      clientRef.current?.channel.send(
        createSyncMessage('PAUSE', 'operator', state.cycleId, undefined)
      );
    }
  }, []);

  const handleExtinguish = useCallback(() => {
    const store = useOperatorStore.getState();
    const state = store.engineState;
    store.setLocalAutoActive(false);
    store.setLocalFlameHeight(0);
    store.setLocalFlameIntensity(0);
    clientRef.current?.channel.send(
      createSyncMessage('EXTINGUISH', 'operator', state.cycleId, undefined)
    );
  }, []);

  const handleReset = useCallback(() => {
    const store = useOperatorStore.getState();
    const nextCycleId = store.engineState.cycleId + 1;
    store.resetLocal(nextCycleId);
    clientRef.current?.channel.send(
      createSyncMessage('RESET', 'operator', nextCycleId, { nextCycleId })
    );
  }, []);

  const handleChangeRequiredSparks = useCallback((count: number) => {
    const clamped = clampRequiredSparks(count);
    const store = useOperatorStore.getState();
    store.setLocalSettings({ requiredSparks: clamped });
    clientRef.current?.channel.send(
      createSyncMessage('SET_SPARK_SETTINGS', 'operator', store.engineState.cycleId, {
        requiredSparks: clamped,
      })
    );
  }, []);

  const handleChangeAutoInterval = useCallback((sec: number) => {
    const clamped = clampAutoInterval(sec);
    const store = useOperatorStore.getState();
    store.setLocalSettings({ autoIntervalSec: clamped });
    clientRef.current?.channel.send(
      createSyncMessage('SET_SPARK_SETTINGS', 'operator', store.engineState.cycleId, {
        autoIntervalSec: clamped,
      })
    );
  }, []);

  const handleChangeSparkSpeed = useCallback((speed: number) => {
    const clamped = clampSparkSpeed(speed);
    const store = useOperatorStore.getState();
    store.setLocalSettings({ sparkSpeed: clamped });
    clientRef.current?.channel.send(
      createSyncMessage('SET_SPARK_SETTINGS', 'operator', store.engineState.cycleId, {
        sparkSpeed: clamped,
      })
    );
  }, []);

  const handleSelectPreset = useCallback((level: Exclude<FlamePresetLevel, 'OFF'>) => {
    const store = useOperatorStore.getState();
    store.setLocalFlamePreset(level);
    clientRef.current?.channel.send(
      createSyncMessage('SET_FLAME_LEVEL', 'operator', store.engineState.cycleId, { level })
    );
  }, []);

  const handleChangeHeight = useCallback((height: number) => {
    const clamped = clamp01(height);
    const store = useOperatorStore.getState();
    store.setLocalFlameHeight(clamped);
    clientRef.current?.channel.send(
      createSyncMessage('SET_FLAME_HEIGHT', 'operator', store.engineState.cycleId, {
        height: clamped,
      })
    );
  }, []);

  const handleChangeIntensity = useCallback((intensity: number) => {
    const clamped = clamp01(intensity);
    const store = useOperatorStore.getState();
    store.setLocalFlameIntensity(clamped);
    clientRef.current?.channel.send(
      createSyncMessage('SET_FLAME_INTENSITY', 'operator', store.engineState.cycleId, {
        intensity: clamped,
      })
    );
  }, []);

  const handleStepFlame = useCallback((delta: number) => {
    const store = useOperatorStore.getState();
    const nextH = clamp01(store.engineState.flameHeight + delta);
    const nextI = clamp01(store.engineState.flameIntensity + delta);
    store.setLocalFlameHeight(nextH);
    store.setLocalFlameIntensity(nextI);
    clientRef.current?.channel.send(
      createSyncMessage('SET_FLAME_HEIGHT', 'operator', store.engineState.cycleId, {
        height: nextH,
      })
    );
    clientRef.current?.channel.send(
      createSyncMessage('SET_FLAME_INTENSITY', 'operator', store.engineState.cycleId, {
        intensity: nextI,
      })
    );
  }, []);

  const handleOpenDisplay = useCallback(() => {
    setFullscreenNote(null);
    if (displayWindowRef.current && !displayWindowRef.current.closed) {
      displayWindowRef.current.focus();
      return;
    }
    const win = window.open('/display', 'flame-globe-display', 'noopener=no');
    displayWindowRef.current = win;
  }, []);

  const handleFullscreenDisplay = useCallback(async () => {
    setFullscreenNote(null);
    let win = displayWindowRef.current;
    if (!win || win.closed) {
      win = window.open('/display', 'flame-globe-display', 'noopener=no');
      displayWindowRef.current = win;
    }
    if (!win) {
      setFullscreenNote('Popup blocked. Please allow popups or open /display directly.');
      return;
    }
    try {
      win.focus();
      await win.document.documentElement.requestFullscreen();
    } catch {
      setFullscreenNote(
        'Browser blocked cross-window fullscreen gesture. Focus the Display tab and press F11.'
      );
    }
  }, []);

  return (
    <div className="control-root">
      <header className="control-header">
        <div className="brand">
          <h1>FLAME GLOBE</h1>
          <p>Golden Ceremonial Flame Control</p>
        </div>

        <div className="header-meta">
          <div className="meta-badge">
            <span className="meta-label">Status</span>
            <span className="meta-value">{engineState.status}</span>
          </div>
          <div className="meta-badge">
            <span className="meta-label">Display</span>
            <span className={`meta-value ${displayConnected ? 'gold-text' : 'muted-text'}`}>
              {displayConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          <div className="meta-badge">
            <span className="meta-label">Sparks</span>
            <span className="meta-value gold-text">
              {engineState.completedSparks} / {engineState.requiredSparks}
            </span>
          </div>
          <div className="meta-badge">
            <span className="meta-label">Progress</span>
            <span className="meta-value gold-text">
              {Math.round(engineState.progress * 100)}%
            </span>
          </div>
        </div>
      </header>

      <main className="control-main">
        <ProgressIndicator state={engineState} />

        <div className="control-columns">
          <div className="column-stack">
            <MainActions
              state={engineState}
              onReleaseSpark={handleReleaseSpark}
              onToggleAuto={handleToggleAuto}
              onFullFlame={handleFullFlame}
              onTogglePause={handleTogglePause}
              onExtinguish={handleExtinguish}
              onReset={handleReset}
            />
            <DisplayControls
              displayConnected={displayConnected}
              onOpenDisplay={handleOpenDisplay}
              onFullscreenDisplay={handleFullscreenDisplay}
              fullscreenNote={fullscreenNote}
            />
          </div>

          <div className="column-stack">
            <FlameSettings
              state={engineState}
              onSelectPreset={handleSelectPreset}
              onChangeHeight={handleChangeHeight}
              onChangeIntensity={handleChangeIntensity}
              onStepFlame={handleStepFlame}
            />
            <SparkSettings
              state={engineState}
              onChangeRequiredSparks={handleChangeRequiredSparks}
              onChangeAutoInterval={handleChangeAutoInterval}
              onChangeSparkSpeed={handleChangeSparkSpeed}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
