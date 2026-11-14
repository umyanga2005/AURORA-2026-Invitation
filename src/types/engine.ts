import type { FlameColorPalette } from '../config/flameColors';
import type { FlamePresetLevel } from '../types/flame';

export type IgnitionStatus =
  | 'IDLE'
  | 'IGNITING'
  | 'AUTO_IGNITING'
  | 'PAUSED'
  | 'LIT'
  | 'EXTINGUISHING';

export interface EngineSettings {
  requiredSparks: number;
  autoIntervalSec: number;
  sparkSpeed: number; // 0.5 (slow) .. 2.0 (fast), default 1.0
}

export interface SharedEngineState {
  cycleId: number;
  status: IgnitionStatus;
  autoActive: boolean;
  paused: boolean;
  requiredSparks: number;
  completedSparks: number;
  inFlightSparks: number;
  progress: number; // 0..1
  flameHeight: number; // target 0..1
  flameIntensity: number; // target 0..1
  flamePreset: FlamePresetLevel;
  flameColorId: string;
  customFlamePalette?: FlameColorPalette;
  autoIntervalSec: number;
  sparkSpeed: number;
  lastUpdatedAt: number;
}
