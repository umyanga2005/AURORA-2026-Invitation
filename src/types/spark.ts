export type SparkSpawnRegion =
  | 'upper-left'
  | 'upper-right'
  | 'left-side'
  | 'right-side'
  | 'upper-center';

export interface Vec2 {
  x: number;
  y: number;
}

export interface SparkInstance {
  id: string;
  cycleId: number;
  startPos: Vec2;
  controlPos: Vec2;
  targetPos: Vec2;
  /** Travel duration in seconds */
  duration: number;
  /** Normalized progress 0..1 */
  progress: number;
  completed: boolean;
  region: SparkSpawnRegion;
  seed: number;
}

export interface ImpactBurst {
  id: string;
  x: number;
  y: number;
  age: number;
  duration: number;
  seed: number;
}
