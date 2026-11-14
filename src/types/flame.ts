export type FlamePresetLevel = 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';

export interface FlameParameters {
  /** Target flame height (0..1, where 1 = 100%) */
  targetHeight: number;
  /** Target flame intensity/brightness (0..1, where 1 = 100%) */
  targetIntensity: number;
  /** Current smoothed height (0..1) */
  currentHeight: number;
  /** Current smoothed intensity (0..1) */
  currentIntensity: number;
  /** Selected preset if matching */
  activePreset: FlamePresetLevel;
}

export interface FlamePresetConfig {
  level: Exclude<FlamePresetLevel, 'OFF'>;
  label: string;
  height: number;
  intensity: number;
}
