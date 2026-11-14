import type { FlamePresetConfig } from '../types/flame';
import type { SharedEngineState } from '../types/engine';
import { DEFAULT_FLAME_COLOR_ID } from './flameColors';

export const DEFAULT_REQUIRED_SPARKS = 20;
export const MIN_REQUIRED_SPARKS = 1;
export const MAX_REQUIRED_SPARKS = 100;

export const DEFAULT_AUTO_INTERVAL_SEC = 1.5;
export const MIN_AUTO_INTERVAL_SEC = 0.3;
export const MAX_AUTO_INTERVAL_SEC = 5.0;

export const DEFAULT_SPARK_SPEED = 1.0;
export const MIN_SPARK_SPEED = 0.4;
export const MAX_SPARK_SPEED = 2.5;

export const FULL_FLAME_TRANSITION_SEC = 2.0;

export const FLAME_PRESETS: FlamePresetConfig[] = [
  { level: 'LOW', label: 'LOW', height: 0.2, intensity: 0.2 },
  { level: 'MEDIUM', label: 'MEDIUM', height: 0.45, intensity: 0.45 },
  { level: 'HIGH', label: 'HIGH', height: 0.75, intensity: 0.75 },
  { level: 'FULL', label: 'FULL', height: 1.0, intensity: 1.0 },
];

export const BROADCAST_CHANNEL_NAME = 'flame-globe-sync';

export function createInitialEngineState(cycleId = 1): SharedEngineState {
  return {
    cycleId,
    status: 'IDLE',
    autoActive: false,
    paused: false,
    requiredSparks: DEFAULT_REQUIRED_SPARKS,
    completedSparks: 0,
    inFlightSparks: 0,
    progress: 0,
    flameHeight: 0,
    flameIntensity: 0,
    flamePreset: 'OFF',
    flameColorId: DEFAULT_FLAME_COLOR_ID,
    autoIntervalSec: DEFAULT_AUTO_INTERVAL_SEC,
    sparkSpeed: DEFAULT_SPARK_SPEED,
    lastUpdatedAt: Date.now(),
  };
}
