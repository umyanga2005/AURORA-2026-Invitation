import {
  DEFAULT_AUTO_INTERVAL_SEC,
  DEFAULT_REQUIRED_SPARKS,
  DEFAULT_SPARK_SPEED,
  FULL_FLAME_TRANSITION_SEC,
} from '../config/defaults';
import { getFlamePalette, type FlameColorPalette } from '../config/flameColors';
import {
  clamp01,
  clampAutoInterval,
  clampRequiredSparks,
  clampSparkSpeed,
  computeProgressiveFlameTargets,
} from '../config/validation';
import type { SharedEngineState } from '../types/engine';
import type { FlamePresetLevel } from '../types/flame';
import type { SparkInstance } from '../types/spark';
import type { PlaneTransform } from '../assets/lampMasks';
import { AnimationClock } from './AnimationClock';
import { FlameEngine } from './FlameEngine';
import { SparkEngine, type ViewportBounds } from './SparkEngine';
import { IgnitionStateMachine } from './StateMachine';

export interface IgnitionCallbacks {
  onSparkStarted?: (spark: SparkInstance, inFlightCount: number) => void;
  onSparkImpacted?: (spark: SparkInstance, state: SharedEngineState) => void;
  onStateChanged?: (state: SharedEngineState) => void;
}

export class ProgressiveIgnitionController {
  public readonly clock = new AnimationClock();
  public readonly flame = new FlameEngine();
  public readonly sparks = new SparkEngine();
  public readonly stateMachine = new IgnitionStateMachine();

  private cycleId = 1;
  private requiredSparks = DEFAULT_REQUIRED_SPARKS;
  private completedSparks = 0;
  private autoActive = false;
  private autoIntervalSec = DEFAULT_AUTO_INTERVAL_SEC;
  private autoAccumulator = 0;
  private sparkSpeed = DEFAULT_SPARK_SPEED;
  private seenImpactIds = new Set<string>();
  private callbacks: IgnitionCallbacks;

  private viewport: ViewportBounds = { halfWidth: 4.5, halfHeight: 2.53 };
  private lampPlane: PlaneTransform = {
    centerX: 0,
    centerY: -1.15,
    width: 3.4,
    height: 3.4 / 1.5,
  };

  constructor(callbacks: IgnitionCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setSceneGeometry(viewport: ViewportBounds, lampPlane: PlaneTransform): void {
    this.viewport = viewport;
    this.lampPlane = lampPlane;
  }

  public getCycleId(): number {
    return this.cycleId;
  }

  public canReleaseSpark(): boolean {
    if (this.clock.isPaused()) return false;
    if (this.stateMachine.getStatus() === 'EXTINGUISHING') return false;
    return this.completedSparks + this.sparks.getInFlightCount() < this.requiredSparks;
  }

  public releaseSpark(sparkId: string, cycleId?: number, speedOverride?: number): boolean {
    if (cycleId !== undefined && cycleId !== this.cycleId) return false;
    if (!this.canReleaseSpark()) return false;

    const speed = speedOverride !== undefined ? clampSparkSpeed(speedOverride) : this.sparkSpeed;
    const spark = this.sparks.spawnSpark(
      sparkId,
      this.cycleId,
      speed,
      this.viewport,
      this.lampPlane
    );

    if (this.stateMachine.getStatus() === 'IDLE') {
      this.stateMachine.setStatus(this.autoActive ? 'AUTO_IGNITING' : 'IGNITING');
    }

    this.callbacks.onSparkStarted?.(spark, this.sparks.getInFlightCount());
    this.emitState();
    return true;
  }

  public startAuto(requiredSparks?: number, autoIntervalSec?: number, sparkSpeed?: number): void {
    if (requiredSparks !== undefined) {
      this.requiredSparks = clampRequiredSparks(requiredSparks);
    }
    if (autoIntervalSec !== undefined) {
      this.autoIntervalSec = clampAutoInterval(autoIntervalSec);
    }
    if (sparkSpeed !== undefined) {
      this.sparkSpeed = clampSparkSpeed(sparkSpeed);
    }

    if (this.completedSparks >= this.requiredSparks) {
      this.autoActive = false;
      this.emitState();
      return;
    }

    this.autoActive = true;
    this.clock.setPaused(false);
    this.stateMachine.setStatus('AUTO_IGNITING');
    // Trigger first spark immediately on next step
    this.autoAccumulator = this.autoIntervalSec;
    this.emitState();
  }

  public stopAuto(): void {
    this.autoActive = false;
    this.autoAccumulator = 0;
    if (this.stateMachine.getStatus() === 'AUTO_IGNITING') {
      this.stateMachine.setStatus(
        this.completedSparks >= this.requiredSparks ? 'LIT' : this.completedSparks > 0 ? 'IGNITING' : 'IDLE'
      );
    }
    this.emitState();
  }

  public updateSparkSettings(settings: {
    requiredSparks?: number;
    autoIntervalSec?: number;
    sparkSpeed?: number;
  }): void {
    if (settings.requiredSparks !== undefined) {
      this.requiredSparks = clampRequiredSparks(settings.requiredSparks);
    }
    if (settings.autoIntervalSec !== undefined) {
      this.autoIntervalSec = clampAutoInterval(settings.autoIntervalSec);
    }
    if (settings.sparkSpeed !== undefined) {
      this.sparkSpeed = clampSparkSpeed(settings.sparkSpeed);
    }
    this.emitState();
  }

  public setFlameLevel(level: Exclude<FlamePresetLevel, 'OFF'>): void {
    this.flame.setPreset(level);
    if (this.stateMachine.getStatus() === 'IDLE' || this.stateMachine.getStatus() === 'EXTINGUISHING') {
      this.stateMachine.setStatus('LIT');
    }
    this.emitState();
  }

  public setFlameHeight(height: number): void {
    this.flame.setTargetHeight(height);
    this.emitState();
  }

  public setFlameIntensity(intensity: number): void {
    this.flame.setTargetIntensity(intensity);
    this.emitState();
  }

  public setFlameColor(paletteId: string, customPalette?: FlameColorPalette): void {
    const palette = getFlamePalette(paletteId, customPalette);
    this.flame.setColorPalette(palette);
    this.emitState();
  }

  public triggerFullFlame(durationSec = FULL_FLAME_TRANSITION_SEC): void {
    this.autoActive = false;
    this.autoAccumulator = 0;
    this.sparks.clearAll();
    this.clock.setPaused(false);
    this.completedSparks = this.requiredSparks;
    this.flame.triggerFullFlame(durationSec);
    this.stateMachine.setStatus('LIT');
    this.emitState();
  }

  public pause(): void {
    this.clock.setPaused(true);
    this.stateMachine.pause();
    this.emitState();
  }

  public resume(): void {
    this.clock.setPaused(false);
    const restored = this.stateMachine.resume();
    if (restored === 'PAUSED') {
      this.stateMachine.setStatus(this.autoActive ? 'AUTO_IGNITING' : 'IDLE');
    }
    this.emitState();
  }

  public extinguish(): void {
    this.autoActive = false;
    this.autoAccumulator = 0;
    this.sparks.clearAll();
    this.clock.setPaused(false);
    this.flame.extinguish();
    this.stateMachine.setStatus('EXTINGUISHING');
    this.emitState();
  }

  public reset(nextCycleId?: number): void {
    this.cycleId = nextCycleId !== undefined ? nextCycleId : this.cycleId + 1;
    this.completedSparks = 0;
    this.autoActive = false;
    this.autoAccumulator = 0;
    this.seenImpactIds.clear();
    this.sparks.clearAll();
    this.flame.reset();
    this.clock.reset();
    this.stateMachine.reset();
    this.emitState();
  }

  public applySnapshot(snapshot: SharedEngineState): void {
    this.cycleId = snapshot.cycleId;
    this.requiredSparks = clampRequiredSparks(snapshot.requiredSparks);
    this.completedSparks = Math.min(this.requiredSparks, Math.max(0, snapshot.completedSparks));
    this.autoActive = snapshot.autoActive;
    this.autoIntervalSec = clampAutoInterval(snapshot.autoIntervalSec);
    this.sparkSpeed = clampSparkSpeed(snapshot.sparkSpeed);
    this.clock.setPaused(snapshot.paused);
    this.stateMachine.setStatus(snapshot.status);
    this.flame.setTargets(snapshot.flameHeight, snapshot.flameIntensity);
    if (snapshot.flameColorId) {
      const palette = getFlamePalette(snapshot.flameColorId, snapshot.customFlamePalette);
      this.flame.setColorPalette(palette);
    }
    this.sparks.clearAll();
    this.seenImpactIds.clear();
  }

  public step(rawDeltaSec: number, createSparkId: () => string): void {
    const dt = this.clock.step(rawDeltaSec);
    if (dt <= 0) return;

    // Handle auto ignition timer
    if (this.autoActive && !this.clock.isPaused()) {
      this.autoAccumulator += dt;
      if (this.autoAccumulator >= this.autoIntervalSec) {
        this.autoAccumulator -= this.autoIntervalSec;
        if (this.canReleaseSpark()) {
          this.releaseSpark(createSparkId(), this.cycleId);
        } else if (this.completedSparks >= this.requiredSparks) {
          this.stopAuto();
        }
      }
    }

    // Update travelling sparks & handle impacts
    this.sparks.update(dt, this.cycleId, (spark) => {
      if (spark.cycleId !== this.cycleId) return;
      if (this.seenImpactIds.has(spark.id)) return;
      this.seenImpactIds.add(spark.id);

      if (this.completedSparks < this.requiredSparks) {
        this.completedSparks += 1;
      }

      const progress = clamp01(this.completedSparks / this.requiredSparks);
      const { height, intensity } = computeProgressiveFlameTargets(progress);
      this.flame.setTargets(height, intensity, progress >= 1 ? 2.4 : 3.2);

      if (this.completedSparks >= this.requiredSparks) {
        this.autoActive = false;
        this.stateMachine.setStatus('LIT');
      } else if (this.autoActive) {
        this.stateMachine.setStatus('AUTO_IGNITING');
      } else {
        this.stateMachine.setStatus('IGNITING');
      }

      const snapshot = this.getSnapshot();
      this.callbacks.onSparkImpacted?.(spark, snapshot);
      this.callbacks.onStateChanged?.(snapshot);
    });

    // Update flame interpolation
    const flameParams = this.flame.update(dt);
    if (
      this.stateMachine.getStatus() === 'EXTINGUISHING' &&
      flameParams.currentHeight <= 0.002 &&
      flameParams.currentIntensity <= 0.002
    ) {
      this.stateMachine.setStatus('IDLE');
      this.emitState();
    }
  }

  public getSnapshot(): SharedEngineState {
    const flameState = this.flame.getState();
    const progress = clamp01(this.completedSparks / Math.max(1, this.requiredSparks));
    return {
      cycleId: this.cycleId,
      status: this.stateMachine.getStatus(),
      autoActive: this.autoActive,
      paused: this.clock.isPaused(),
      requiredSparks: this.requiredSparks,
      completedSparks: this.completedSparks,
      inFlightSparks: this.sparks.getInFlightCount(),
      progress,
      flameHeight: flameState.targetHeight,
      flameIntensity: flameState.targetIntensity,
      flamePreset: flameState.activePreset,
      flameColorId: flameState.colorPalette.id,
      customFlamePalette:
        flameState.colorPalette.id === 'custom' ? flameState.colorPalette : undefined,
      autoIntervalSec: this.autoIntervalSec,
      sparkSpeed: this.sparkSpeed,
      lastUpdatedAt: Date.now(),
    };
  }

  private emitState(): void {
    this.callbacks.onStateChanged?.(this.getSnapshot());
  }
}
