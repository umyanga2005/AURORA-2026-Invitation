import { useEffect, useRef } from 'react';

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
  streak: boolean;
}

interface AmbientSparksOverlayProps {
  active: boolean;
  burstKey: number;
}

export function AmbientSparksOverlay({ active, burstKey }: AmbientSparksOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<SparkParticle[]>([]);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
    if (!active) {
      particlesRef.current = [];
    }
  }, [active]);

  // Celebratory ignition burst from the lamp bowl position
  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const originX = w * 0.5;
    const originY = h * 0.72;

    for (let i = 0; i < 65; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.45;
      const speed = 110 + Math.random() * 290;
      particlesRef.current.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.4 + Math.random() * 3.1,
        life: 0,
        maxLife: 1.1 + Math.random() * 1.8,
        hue: 26 + Math.random() * 24,
        wobbleAmp: 14 + Math.random() * 28,
        wobbleFreq: 2.0 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
        streak: Math.random() > 0.35,
      });
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnRandomSpark = (w: number, h: number) => {
      // Spawn across bottom and randomly throughout screen so sparks go everywhere organically
      const fromBottom = Math.random() < 0.65;
      const x = Math.random() * w;
      const y = fromBottom ? h * (0.78 + Math.random() * 0.28) : Math.random() * h;

      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 42,
        vy: -(28 + Math.random() * 88),
        size: 1.0 + Math.random() * 2.5,
        life: 0,
        maxLife: 2.2 + Math.random() * 3.4,
        hue: 24 + Math.random() * 28, // fiery orange-amber to golden yellow
        wobbleAmp: 12 + Math.random() * 34,
        wobbleFreq: 1.2 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        streak: Math.random() > 0.5,
      });
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (activeRef.current) {
        spawnAccumulator += dt * 26; // ~26 random ambient sparks/sec
        while (spawnAccumulator >= 1) {
          spawnAccumulator -= 1;
          if (particlesRef.current.length < 180) {
            spawnRandomSpark(w, h);
          }
        }
      }

      const list = particlesRef.current;
      if (list.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life += dt;
          if (p.life >= p.maxLife) {
            list.splice(i, 1);
            continue;
          }

          const progress = p.life / p.maxLife;
          const fadeIn = Math.min(1, progress * 5.0);
          const fadeOut = Math.pow(1 - progress, 1.35);
          const flicker = 0.72 + 0.28 * Math.sin(p.life * 16 + p.phase);
          const alpha = fadeIn * fadeOut * flicker;

          const wobbleX = Math.sin(p.life * p.wobbleFreq + p.phase) * p.wobbleAmp;
          const prevX = p.x;
          const prevY = p.y;

          p.x += (p.vx + wobbleX) * dt;
          p.y += p.vy * dt;
          // Gentle buoyancy deceleration on initial burst
          p.vx *= 0.985;
          p.vy = p.vy * 0.992 - 8 * dt;

          // Outer warm glow
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4.2);
          grad.addColorStop(0, `hsla(${p.hue + 14}, 100%, 88%, ${alpha})`);
          grad.addColorStop(0.35, `hsla(${p.hue}, 100%, 60%, ${alpha * 0.85})`);
          grad.addColorStop(1, `hsla(${p.hue - 10}, 100%, 45%, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4.2, 0, Math.PI * 2);
          ctx.fill();

          // Optional fiery motion streak
          if (p.streak) {
            ctx.strokeStyle = `hsla(${p.hue + 10}, 100%, 78%, ${alpha * 0.75})`;
            ctx.lineWidth = Math.max(0.8, p.size * 0.7);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-sparks-canvas" aria-hidden="true" />;
}
