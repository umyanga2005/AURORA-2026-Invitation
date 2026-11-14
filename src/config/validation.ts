import {
  MAX_AUTO_INTERVAL_SEC,
  MAX_REQUIRED_SPARKS,
  MAX_SPARK_SPEED,
  MIN_AUTO_INTERVAL_SEC,
  MIN_REQUIRED_SPARKS,
  MIN_SPARK_SPEED,
} from './defaults';

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function clampRequiredSparks(count: number): number {
  if (!Number.isFinite(count)) return 20;
  return Math.round(Math.max(MIN_REQUIRED_SPARKS, Math.min(MAX_REQUIRED_SPARKS, count)));
}

export function clampAutoInterval(sec: number): number {
  if (!Number.isFinite(sec)) return 1.5;
  return Math.max(MIN_AUTO_INTERVAL_SEC, Math.min(MAX_AUTO_INTERVAL_SEC, sec));
}

export function clampSparkSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1.0;
  return Math.max(MIN_SPARK_SPEED, Math.min(MAX_SPARK_SPEED, speed));
}

/**
 * Nonlinear progressive ignition curve:
 * - First impact produces a clear small flame (~18% height, ~28% intensity).
 * - Smoothly accelerates through the middle and reaches 1.0 at progress = 1.0.
 */
export function computeProgressiveFlameTargets(progress: number): {
  height: number;
  intensity: number;
} {
  const p = clamp01(progress);
  if (p <= 0) {
    return { height: 0, intensity: 0 };
  }
  const height = 0.14 + 0.86 * Math.pow(p, 0.88);
  const intensity = 0.24 + 0.76 * Math.pow(p, 0.72);
  return {
    height: clamp01(height),
    intensity: clamp01(intensity),
  };
}
