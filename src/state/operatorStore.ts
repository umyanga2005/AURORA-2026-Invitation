import { create } from 'zustand';
import { createInitialEngineState } from '../config/defaults';
import type { FlameColorPalette } from '../config/flameColors';
import {
  clamp01,
  clampAutoInterval,
  clampRequiredSparks,
  clampSparkSpeed,
} from '../config/validation';
import type { SharedEngineState } from '../types/engine';
import type { FlamePresetLevel } from '../types/flame';

interface OperatorStoreState {
  engineState: SharedEngineState;
  displayConnected: boolean;
  lastDisplaySeenAt: number;
  processedSparkIds: Set<string>;
  applySnapshot: (snapshot: SharedEngineState) => void;
  markSparkStarted: (cycleId: number, inFlightSparks: number) => void;
  markSparkImpacted: (
    cycleId: number,
    sparkId: string,
    payload: {
      completedSparks: number;
      inFlightSparks: number;
      progress: number;
      flameHeight: number;
      flameIntensity: number;
      status: SharedEngineState['status'];
    }
  ) => void;
  setLocalSettings: (settings: {
    requiredSparks?: number;
    autoIntervalSec?: number;
    sparkSpeed?: number;
  }) => void;
  setLocalFlamePreset: (level: Exclude<FlamePresetLevel, 'OFF'>) => void;
  setLocalFlameHeight: (height: number) => void;
  setLocalFlameIntensity: (intensity: number) => void;
  setLocalFlameColor: (paletteId: string, customPalette?: FlameColorPalette) => void;
  setLocalAutoActive: (active: boolean) => void;
  setLocalPaused: (paused: boolean) => void;
  resetLocal: (nextCycleId: number) => void;
  setDisplayConnected: (connected: boolean) => void;
}

export const useOperatorStore = create<OperatorStoreState>((set) => ({
  engineState: createInitialEngineState(1),
  displayConnected: false,
  lastDisplaySeenAt: 0,
  processedSparkIds: new Set<string>(),

  applySnapshot: (snapshot) =>
    set((prev) => {
      const resetSet =
        snapshot.cycleId !== prev.engineState.cycleId ? new Set<string>() : prev.processedSparkIds;
      return {
        engineState: snapshot,
        processedSparkIds: resetSet,
        displayConnected: true,
        lastDisplaySeenAt: Date.now(),
      };
    }),

  markSparkStarted: (cycleId, inFlightSparks) =>
    set((prev) => {
      if (cycleId !== prev.engineState.cycleId) return prev;
      return {
        engineState: {
          ...prev.engineState,
          inFlightSparks,
          status:
            prev.engineState.status === 'IDLE'
              ? prev.engineState.autoActive
                ? 'AUTO_IGNITING'
                : 'IGNITING'
              : prev.engineState.status,
          lastUpdatedAt: Date.now(),
        },
      };
    }),

  markSparkImpacted: (cycleId, sparkId, payload) =>
    set((prev) => {
      if (cycleId !== prev.engineState.cycleId) return prev;
      if (prev.processedSparkIds.has(sparkId)) return prev;
      const nextIds = new Set(prev.processedSparkIds);
      nextIds.add(sparkId);

      return {
        processedSparkIds: nextIds,
        engineState: {
          ...prev.engineState,
          completedSparks: payload.completedSparks,
          inFlightSparks: payload.inFlightSparks,
          progress: payload.progress,
          flameHeight: payload.flameHeight,
          flameIntensity: payload.flameIntensity,
          status: payload.status,
          autoActive: payload.status === 'AUTO_IGNITING',
          lastUpdatedAt: Date.now(),
        },
      };
    }),

  setLocalSettings: (settings) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        requiredSparks:
          settings.requiredSparks !== undefined
            ? clampRequiredSparks(settings.requiredSparks)
            : prev.engineState.requiredSparks,
        autoIntervalSec:
          settings.autoIntervalSec !== undefined
            ? clampAutoInterval(settings.autoIntervalSec)
            : prev.engineState.autoIntervalSec,
        sparkSpeed:
          settings.sparkSpeed !== undefined
            ? clampSparkSpeed(settings.sparkSpeed)
            : prev.engineState.sparkSpeed,
        lastUpdatedAt: Date.now(),
      },
    })),

  setLocalFlamePreset: (level) =>
    set((prev) => {
      const map: Record<Exclude<FlamePresetLevel, 'OFF'>, number> = {
        LOW: 0.2,
        MEDIUM: 0.45,
        HIGH: 0.75,
        FULL: 1.0,
      };
      const val = map[level];
      return {
        engineState: {
          ...prev.engineState,
          flameHeight: val,
          flameIntensity: val,
          flamePreset: level,
          status: prev.engineState.status === 'IDLE' ? 'LIT' : prev.engineState.status,
          lastUpdatedAt: Date.now(),
        },
      };
    }),

  setLocalFlameHeight: (height) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        flameHeight: clamp01(height),
        flamePreset: 'OFF',
        lastUpdatedAt: Date.now(),
      },
    })),

  setLocalFlameIntensity: (intensity) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        flameIntensity: clamp01(intensity),
        flamePreset: 'OFF',
        lastUpdatedAt: Date.now(),
      },
    })),

  setLocalFlameColor: (paletteId, customPalette) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        flameColorId: paletteId,
        customFlamePalette: paletteId === 'custom' ? customPalette : undefined,
        lastUpdatedAt: Date.now(),
      },
    })),

  setLocalAutoActive: (active) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        autoActive: active,
        status: active ? 'AUTO_IGNITING' : prev.engineState.status,
        lastUpdatedAt: Date.now(),
      },
    })),

  setLocalPaused: (paused) =>
    set((prev) => ({
      engineState: {
        ...prev.engineState,
        paused,
        status: paused ? 'PAUSED' : prev.engineState.autoActive ? 'AUTO_IGNITING' : 'IGNITING',
        lastUpdatedAt: Date.now(),
      },
    })),

  resetLocal: (nextCycleId) =>
    set({
      processedSparkIds: new Set<string>(),
      engineState: createInitialEngineState(nextCycleId),
    }),

  setDisplayConnected: (displayConnected) =>
    set({
      displayConnected,
      lastDisplaySeenAt: displayConnected ? Date.now() : 0,
    }),
}));
