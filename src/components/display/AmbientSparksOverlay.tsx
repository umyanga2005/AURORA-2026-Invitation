import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface DustParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  depth: number;
  life: number;
  maxLife: number;
  maxAlpha: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  colorIndex: number;
  isBurst: boolean;
}

interface AmbientSparksOverlayProps {
  active: boolean;
  burstKey: number;
  lowPowerMode?: boolean;
}

// Greek Royal Gold palette (RGB tuples for zero-allocation string formatting)
const GOLD_PALETTE: ReadonlyArray<[number, number, number]> = [
  [255, 242, 198], // Highlight #FFF2C6
  [244, 213, 138], // Champagne #F4D58A
  [214, 166, 75],  // Metallic  #D6A64B
  [233, 182, 90],  // Warm Gold #E9B65A
];

const POOL_SIZE = 120;

function createEmptyParticle(): DustParticle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 1,
    depth: 0.5,
    life: 0,
    maxLife: 1,
    maxAlpha: 0.4,
    driftAmp: 6,
    driftFreq: 0.5,
    phase: 0,
    colorIndex: 1,
    isBurst: false,
  };
}

export function AmbientSparksOverlay({
  active,
  burstKey,
  lowPowerMode = false,
}: AmbientSparksOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poolRef = useRef<DustParticle[]>([]);
  const activeRef = useRef(active);
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  const lowPowerRef = useRef(lowPowerMode);

  // Initialize fixed particle pool once
  if (poolRef.current.length === 0) {
    for (let i = 0; i < POOL_SIZE; i++) {
      poolRef.current.push(createEmptyParticle());
    }
  }

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      const pool = poolRef.current;
      for (let i = 0; i < pool.length; i++) {
        pool[i].active = false;
      }
    }
  }, [active]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    lowPowerRef.current = lowPowerMode;
  }, [lowPowerMode]);

  // Refined celebratory golden dust burst on lamp touch
  useEffect(() => {
    if (burstKey === 0 || reducedMotionRef.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const originX = w * 0.5;
    const originY = h * 0.72;
    const burstCount = lowPowerRef.current ? 22 : 34;

    const pool = poolRef.current;
    let spawned = 0;
    for (let i = 0; i < pool.length && spawned < burstCount; i++) {
      const p = pool[i];
      if (p.active) continue;
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.3;
      const speed = 55 + Math.random() * 145;
      const depth = 0.5 + Math.random() * 0.5;

      p.active = true;
      p.isBurst = true;
      p.x = originX + (Math.random() - 0.5) * 52;
      p.y = originY + (Math.random() - 0.5) * 18;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.depth = depth;
      p.radius = (1.1 + Math.random() * 1.9) * depth;
      p.life = 0;
      p.maxLife = 1.6 + Math.random() * 1.8;
      p.maxAlpha = 0.45 + Math.random() * 0.35;
      p.driftAmp = 8 + Math.random() * 14;
      p.driftFreq = 0.7 + Math.random() * 1.0;
      p.phase = Math.random() * Math.PI * 2;
      p.colorIndex = Math.floor(Math.random() * GOLD_PALETTE.length);
      spawned++;
    }
  }, [burstKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let spawnAccumulator = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, lowPowerRef.current ? 1.25 : 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const spawnAmbientDust = () => {
      const pool = poolRef.current;
      const maxAmbient = lowPowerRef.current ? 40 : 66;
      let activeCount = 0;
      let freeSlot: DustParticle | null = null;

      for (let i = 0; i < pool.length; i++) {
        if (pool[i].active) {
          activeCount++;
        } else if (!freeSlot) {
          freeSlot = pool[i];
        }
      }

      if (!freeSlot || activeCount >= maxAmbient) return;

      // Concentrate ~80% of dust around outer left/right edges and lower atmospheric regions
      const zoneRoll = Math.random();
      let x: number;
      let y: number;
      if (zoneRoll < 0.36) {
        // Left flank
        x = width * (Math.random() * 0.24);
        y = height * (0.25 + Math.random() * 0.78);
      } else if (zoneRoll < 0.72) {
        // Right flank
        x = width * (0.76 + Math.random() * 0.24);
        y = height * (0.25 + Math.random() * 0.78);
      } else {
        // Lower atmospheric band
        x = width * (0.1 + Math.random() * 0.8);
        y = height * (0.82 + Math.random() * 0.2);
      }

      const depth = 0.35 + Math.random() * 0.65;
      freeSlot.active = true;
      freeSlot.isBurst = false;
      freeSlot.x = x;
      freeSlot.y = y;
      freeSlot.vx = (Math.random() - 0.5) * 6 * depth;
      freeSlot.vy = -(7 + Math.random() * 15) * depth; // slow, majestic upward float
      freeSlot.depth = depth;
      freeSlot.radius = (0.85 + Math.random() * 1.95) * depth;
      freeSlot.life = 0;
      freeSlot.maxLife = 5.5 + Math.random() * 6.5;
      freeSlot.maxAlpha = (0.18 + Math.random() * 0.36) * (0.65 + depth * 0.35);
      freeSlot.driftAmp = (4 + Math.random() * 10) * depth;
      freeSlot.driftFreq = 0.35 + Math.random() * 0.55;
      freeSlot.phase = Math.random() * Math.PI * 2;
      freeSlot.colorIndex = Math.floor(Math.random() * GOLD_PALETTE.length);
    };

    const drawStaticReducedDust = () => {
      ctx.clearRect(0, 0, width, height);
      if (!activeRef.current) return;
      // Sparse, serene static gold dust around edges for reduced-motion preference
      const count = 18;
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? 0.06 + (i * 0.011) % 0.16 : 0.78 + (i * 0.013) % 0.16;
        const px = width * side;
        const py = height * (0.12 + ((i * 0.17) % 0.8));
        const r = 1.2 + (i % 3) * 0.65;
        const [cr, cg, cb] = GOLD_PALETTE[i % GOLD_PALETTE.length];
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3.2);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.38)`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (reducedMotionRef.current) {
        drawStaticReducedDust();
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      if (activeRef.current) {
        const spawnRate = lowPowerRef.current ? 5.5 : 8.5;
        spawnAccumulator += dt * spawnRate;
        while (spawnAccumulator >= 1) {
          spawnAccumulator -= 1;
          spawnAmbientDust();
        }
      }

      const pool = poolRef.current;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.life += dt;
        if (p.life >= p.maxLife || p.y < -20) {
          p.active = false;
          continue;
        }

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(1, progress * 3.2);
        const fadeOut = Math.pow(1 - progress, 1.45);
        // Gentle slow breathing shimmer (no rapid flicker)
        const shimmer = 0.82 + 0.18 * Math.sin(p.life * 2.1 + p.phase);

        // Softly attenuate particles if they drift over the central text corridor
        const nx = p.x / Math.max(width, 1);
        const ny = p.y / Math.max(height, 1);
        const inTextCorridor = nx > 0.22 && nx < 0.78 && ny > 0.2 && ny < 0.86;
        const corridorFactor = !p.isBurst && inTextCorridor ? 0.35 : 1.0;

        const alpha = p.maxAlpha * fadeIn * fadeOut * shimmer * corridorFactor;

        const swayX = Math.sin(p.life * p.driftFreq + p.phase) * p.driftAmp;
        p.x += (p.vx + swayX) * dt;
        p.y += p.vy * dt;

        if (p.isBurst) {
          p.vx *= 0.965;
          p.vy = p.vy * 0.972 - 4 * dt;
        }

        const [cr, cg, cb] = GOLD_PALETTE[p.colorIndex];
        const glowRadius = p.radius * 3.4;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `rgba(255, 248, 224, ${alpha})`);
        grad.addColorStop(0.38, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.72})`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-sparks-canvas" aria-hidden="true" />;
}
