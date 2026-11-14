import { sampleBowlOpeningWorldTarget, type PlaneTransform } from '../assets/lampMasks';
import type { ImpactBurst, SparkInstance, SparkSpawnRegion, Vec2 } from '../types/spark';

const SPAWN_REGIONS: SparkSpawnRegion[] = [
  'upper-left',
  'upper-right',
  'left-side',
  'right-side',
  'upper-center',
];

export interface ViewportBounds {
  halfWidth: number;
  halfHeight: number;
}

export class SparkEngine {
  private sparks: SparkInstance[] = [];
  private impacts: ImpactBurst[] = [];
  private lastRegionIndex = -1;

  public spawnSpark(
    id: string,
    cycleId: number,
    sparkSpeed: number,
    viewport: ViewportBounds,
    lampPlane: PlaneTransform
  ): SparkInstance {
    // Pick a different region from the previous one when possible for visual variety
    let regionIdx = Math.floor(Math.random() * SPAWN_REGIONS.length);
    if (regionIdx === this.lastRegionIndex) {
      regionIdx = (regionIdx + 1 + Math.floor(Math.random() * 3)) % SPAWN_REGIONS.length;
    }
    this.lastRegionIndex = regionIdx;
    const region = SPAWN_REGIONS[regionIdx];

    const startPos = this.sampleSafeSpawnPos(region, viewport, lampPlane);
    const targetPos = sampleBowlOpeningWorldTarget(lampPlane);

    // Compute curved Bezier control point that arcs gracefully toward the bowl
    const midX = (startPos.x + targetPos.x) * 0.5;
    const midY = (startPos.y + targetPos.y) * 0.5;
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const dist = Math.hypot(dx, dy);
    const perpX = -dy / Math.max(0.001, dist);
    const perpY = dx / Math.max(0.001, dist);
    const curveDir = Math.random() > 0.5 ? 1 : -1;
    const arcOffset = dist * (0.18 + Math.random() * 0.22) * curveDir;

    const controlPos: Vec2 = {
      x: midX + perpX * arcOffset,
      y: Math.max(targetPos.y + 0.35, midY + perpY * arcOffset + dist * 0.12),
    };

    // Travel duration scaled by distance and operator speed
    const baseDuration = 1.25 + Math.random() * 0.55;
    const duration = Math.max(0.45, baseDuration / Math.max(0.35, sparkSpeed));

    const spark: SparkInstance = {
      id,
      cycleId,
      startPos,
      controlPos,
      targetPos,
      duration,
      progress: 0,
      completed: false,
      region,
      seed: Math.random() * 100,
    };

    this.sparks.push(spark);
    return spark;
  }

  private sampleSafeSpawnPos(
    region: SparkSpawnRegion,
    viewport: ViewportBounds,
    lampPlane: PlaneTransform
  ): Vec2 {
    const marginX = viewport.halfWidth * 0.1;
    const marginY = viewport.halfHeight * 0.1;
    const safeW = Math.max(1.5, viewport.halfWidth - marginX);
    const safeH = Math.max(1.2, viewport.halfHeight - marginY);

    // Lamp exclusion zone in world coordinates
    const lampLeft = lampPlane.centerX - lampPlane.width * 0.36;
    const lampRight = lampPlane.centerX + lampPlane.width * 0.36;
    const lampTop = lampPlane.centerY + lampPlane.height * 0.34;
    const lampBottom = lampPlane.centerY - lampPlane.height * 0.38;

    for (let attempt = 0; attempt < 12; attempt++) {
      let x = 0;
      let y = 0;

      switch (region) {
        case 'upper-left':
          x = -safeW * (0.35 + Math.random() * 0.6);
          y = safeH * (0.35 + Math.random() * 0.6);
          break;
        case 'upper-right':
          x = safeW * (0.35 + Math.random() * 0.6);
          y = safeH * (0.35 + Math.random() * 0.6);
          break;
        case 'left-side':
          x = -safeW * (0.55 + Math.random() * 0.4);
          y = -safeH * 0.15 + Math.random() * safeH * 0.7;
          break;
        case 'right-side':
          x = safeW * (0.55 + Math.random() * 0.4);
          y = -safeH * 0.15 + Math.random() * safeH * 0.7;
          break;
        case 'upper-center':
          x = (Math.random() * 2 - 1) * safeW * 0.35;
          y = safeH * (0.55 + Math.random() * 0.4);
          break;
      }

      const insideLamp =
        x >= lampLeft && x <= lampRight && y >= lampBottom && y <= lampTop;
      if (!insideLamp) {
        return { x, y };
      }
    }

    // Fallback guaranteed safe upper corner
    return {
      x: (Math.random() > 0.5 ? 1 : -1) * safeW * 0.72,
      y: safeH * 0.78,
    };
  }

  public evaluatePosition(spark: SparkInstance, t: number): Vec2 {
    const u = 1 - t;
    const bx =
      u * u * spark.startPos.x +
      2 * u * t * spark.controlPos.x +
      t * t * spark.targetPos.x;
    const by =
      u * u * spark.startPos.y +
      2 * u * t * spark.controlPos.y +
      t * t * spark.targetPos.y;

    // Subtle organic flutter that fades to 0 at start and target
    const envelope = Math.sin(t * Math.PI);
    const wobbleX = Math.sin(t * 14.0 + spark.seed) * 0.06 * envelope;
    const wobbleY = Math.cos(t * 11.0 + spark.seed * 1.7) * 0.04 * envelope;

    return { x: bx + wobbleX, y: by + wobbleY };
  }

  public update(
    dt: number,
    activeCycleId: number,
    onImpact: (spark: SparkInstance) => void
  ): void {
    if (dt <= 0) return;

    const remaining: SparkInstance[] = [];
    for (const spark of this.sparks) {
      if (spark.cycleId !== activeCycleId) {
        continue;
      }
      spark.progress = Math.min(1, spark.progress + dt / spark.duration);
      if (spark.progress >= 1 && !spark.completed) {
        spark.completed = true;
        this.impacts.push({
          id: `imp-${spark.id}`,
          x: spark.targetPos.x,
          y: spark.targetPos.y,
          age: 0,
          duration: 0.55,
          seed: spark.seed,
        });
        onImpact(spark);
      } else {
        remaining.push(spark);
      }
    }
    this.sparks = remaining;

    const nextImpacts: ImpactBurst[] = [];
    for (const imp of this.impacts) {
      imp.age += dt;
      if (imp.age < imp.duration) {
        nextImpacts.push(imp);
      }
    }
    this.impacts = nextImpacts;
  }

  public getActiveSparks(): readonly SparkInstance[] {
    return this.sparks;
  }

  public getActiveImpacts(): readonly ImpactBurst[] {
    return this.impacts;
  }

  public getInFlightCount(): number {
    return this.sparks.length;
  }

  public clearAll(): void {
    this.sparks = [];
    this.impacts = [];
  }
}
