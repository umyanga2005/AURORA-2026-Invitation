import { LAMP_METADATA } from './lampMetadata';

export const LAMP_MASK_PATHS = {
  transparency: '/masks/lamp-transparency-mask.png',
  bowlOpening: '/masks/bowl-opening-mask.png',
  frontRimForeground: '/masks/front-rim-foreground-mask.png',
  lowerConnector: '/masks/lower-connector-mask.png',
} as const;

export interface PlaneTransform {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/**
 * Converts a normalized image coordinate (0..1, top-left origin)
 * to Three.js world space (x right, y up) on the lamp plane.
 */
export function imageNormToWorld(
  normX: number,
  normY: number,
  plane: PlaneTransform
): { x: number; y: number } {
  const x = plane.centerX + (normX - 0.5) * plane.width;
  const y = plane.centerY + (0.5 - normY) * plane.height;
  return { x, y };
}

/**
 * Samples a randomized target point inside the visible bowl opening in world space.
 */
export function sampleBowlOpeningWorldTarget(
  plane: PlaneTransform,
  seedFraction?: number
): { x: number; y: number } {
  const { bowlOpening } = LAMP_METADATA;
  // Distribute across inner 78% of the opening width so sparks clearly enter the bowl
  const u = seedFraction !== undefined ? seedFraction * 2 - 1 : Math.random() * 2 - 1;
  const v = (Math.random() * 2 - 1) * Math.sqrt(Math.max(0, 1 - u * u * 0.85));
  const normX = bowlOpening.centerX + u * bowlOpening.radiusX * 0.72;
  const normY = bowlOpening.centerY + v * bowlOpening.radiusY * 0.55;
  return imageNormToWorld(normX, normY, plane);
}
