export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface NormalizedBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface LampMetadata {
  imagePath: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  /** Clean non-transparent lamp bounds (normalized 0..1, top-left origin) */
  lampBounds: NormalizedBounds;
  /** Horizontal center of the bowl (normalized 0..1) */
  centerX: number;
  /** Outer rim widest span (normalized 0..1) */
  outerRim: {
    leftX: number;
    rightX: number;
    widestY: number;
    topY: number;
  };
  /** Inner bowl opening ellipse (normalized 0..1, top-left origin) */
  bowlOpening: {
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
    backEdgeY: number;
    frontEdgeY: number;
  };
  /** Front rim lip curve parameters */
  frontRim: {
    centerY: number;
    curveCenterY: number;
    curveRadiusX: number;
    curveRadiusY: number;
  };
  /** Transition where bowl meets stepped lower connector */
  bowlBottomY: number;
  /** Lower decorative connector bounds */
  lowerConnector: NormalizedBounds;
}

/**
 * Exact coordinates measured from public/references/golden-greek-lamp-transparent.png (1536x1024 RGBA).
 * Origin (0,0) is top-left of the image; (1,1) is bottom-right.
 */
export const LAMP_METADATA: LampMetadata = {
  imagePath: '/references/golden-greek-lamp-transparent.png',
  naturalWidth: 1536,
  naturalHeight: 1024,
  aspectRatio: 1536 / 1024,
  lampBounds: {
    left: 272 / 1536,   // 0.1771
    top: 198 / 1024,    // 0.1934
    right: 1258 / 1536, // 0.8190
    bottom: 846 / 1024, // 0.8262
    width: (1258 - 272) / 1536,
    height: (846 - 198) / 1024,
  },
  centerX: 765 / 1536, // 0.4980
  outerRim: {
    leftX: 273 / 1536,   // 0.1777
    rightX: 1258 / 1536, // 0.8190
    widestY: 257 / 1024, // 0.2510
    topY: 198 / 1024,    // 0.1934
  },
  bowlOpening: {
    centerX: 765.5 / 1536, // 0.4984
    centerY: 240 / 1024,   // 0.2344
    radiusX: 475 / 1536,   // 0.3092
    radiusY: 34 / 1024,    // 0.0332
    backEdgeY: 207 / 1024, // 0.2021
    frontEdgeY: 276 / 1024,// 0.2695
  },
  frontRim: {
    centerY: 276 / 1024,      // 0.2695
    curveCenterY: 241 / 1024, // 0.2354
    curveRadiusX: 485 / 1536, // 0.3158
    curveRadiusY: 35 / 1024,  // 0.0342
  },
  bowlBottomY: 606 / 1024, // 0.5918
  lowerConnector: {
    left: 527 / 1536,   // 0.3431
    top: 606 / 1024,    // 0.5918
    right: 1005 / 1536, // 0.6543
    bottom: 846 / 1024, // 0.8262
    width: (1005 - 527) / 1536,
    height: (846 - 606) / 1024,
  },
};
