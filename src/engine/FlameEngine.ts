import { FLAME_PRESETS, FULL_FLAME_TRANSITION_SEC } from '../config/defaults';
import { clamp01 } from '../config/validation';
import type { FlameParameters, FlamePresetLevel } from '../types/flame';

export class FlameEngine {
  private targetHeight = 0;
  private targetIntensity = 0;
  private currentHeight = 0;
  private currentIntensity = 0;
  private activePreset: FlamePresetLevel = 'OFF';
  private smoothingRate = 3.2;

  public setTargets(height: number, intensity: number, smoothingRate = 3.2): void {
    this.targetHeight = clamp01(height);
    this.targetIntensity = clamp01(intensity);
    this.smoothingRate = smoothingRate;
    this.activePreset = this.detectPreset(this.targetHeight, this.targetIntensity);
  }

  public setTargetHeight(height: number): void {
    this.targetHeight = clamp01(height);
    this.smoothingRate = 4.0;
    this.activePreset = this.detectPreset(this.targetHeight, this.targetIntensity);
  }

  public setTargetIntensity(intensity: number): void {
    this.targetIntensity = clamp01(intensity);
    this.smoothingRate = 4.0;
    this.activePreset = this.detectPreset(this.targetHeight, this.targetIntensity);
  }

  public setPreset(level: Exclude<FlamePresetLevel, 'OFF'>): void {
    const preset = FLAME_PRESETS.find((p) => p.level === level);
    if (!preset) return;
    this.targetHeight = preset.height;
    this.targetIntensity = preset.intensity;
    this.activePreset = preset.level;
    this.smoothingRate = 3.2;
  }

  public triggerFullFlame(durationSec = FULL_FLAME_TRANSITION_SEC): void {
    this.targetHeight = 1.0;
    this.targetIntensity = 1.0;
    this.activePreset = 'FULL';
    // Reach ~98% within durationSec
    this.smoothingRate = 3.8 / Math.max(0.4, durationSec);
  }

  public extinguish(): void {
    this.targetHeight = 0;
    this.targetIntensity = 0;
    this.activePreset = 'OFF';
    this.smoothingRate = 2.6;
  }

  public reset(): void {
    this.targetHeight = 0;
    this.targetIntensity = 0;
    this.currentHeight = 0;
    this.currentIntensity = 0;
    this.activePreset = 'OFF';
    this.smoothingRate = 3.2;
  }

  public update(dt: number): FlameParameters {
    if (dt > 0) {
      const alpha = 1 - Math.exp(-this.smoothingRate * dt);
      this.currentHeight += (this.targetHeight - this.currentHeight) * alpha;
      this.currentIntensity += (this.targetIntensity - this.currentIntensity) * alpha;

      if (Math.abs(this.targetHeight - this.currentHeight) < 0.001) {
        this.currentHeight = this.targetHeight;
      }
      if (Math.abs(this.targetIntensity - this.currentIntensity) < 0.001) {
        this.currentIntensity = this.targetIntensity;
      }
    }

    return {
      targetHeight: this.targetHeight,
      targetIntensity: this.targetIntensity,
      currentHeight: this.currentHeight,
      currentIntensity: this.currentIntensity,
      activePreset: this.activePreset,
    };
  }

  public getState(): FlameParameters {
    return {
      targetHeight: this.targetHeight,
      targetIntensity: this.targetIntensity,
      currentHeight: this.currentHeight,
      currentIntensity: this.currentIntensity,
      activePreset: this.activePreset,
    };
  }

  private detectPreset(h: number, i: number): FlamePresetLevel {
    if (h <= 0.005 && i <= 0.005) return 'OFF';
    for (const preset of FLAME_PRESETS) {
      if (Math.abs(h - preset.height) < 0.015 && Math.abs(i - preset.intensity) < 0.015) {
        return preset.level;
      }
    }
    return 'OFF';
  }
}
