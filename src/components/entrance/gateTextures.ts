import * as THREE from 'three';

export interface DoorTextureSet {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  dispose: () => void;
}

function drawGreekKeyHorizontal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  cellSize: number,
  color: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  const step = cellSize * 4;
  const count = Math.floor(width / step);
  const startX = x + (width - count * step) * 0.5;
  const s = cellSize;

  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const ox = startX + i * step;
    ctx.moveTo(ox, y + s * 2);
    ctx.lineTo(ox + s * 3, y + s * 2);
    ctx.lineTo(ox + s * 3, y);
    ctx.lineTo(ox + s, y);
    ctx.lineTo(ox + s, y + s);
    ctx.lineTo(ox + s * 2, y + s);
    ctx.moveTo(ox + s * 3, y + s * 2);
    ctx.lineTo(ox + s * 4, y + s * 2);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLaurelSpray(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;

  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      cx,
      cy + radius * 0.15,
      radius * 0.78,
      Math.PI * (0.5 - dir * 0.42),
      Math.PI * (0.5 + dir * 0.02),
      dir < 0
    );
    ctx.stroke();

    const leafCount = 7;
    for (let i = 0; i < leafCount; i++) {
      const t = i / (leafCount - 1);
      const angle = Math.PI * (0.55 + t * 0.75);
      const lx = cx + dir * Math.sin(angle) * radius * 0.72;
      const ly = cy + Math.cos(angle) * radius * 0.72;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(dir * (0.5 - t * 1.1));
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.14, radius * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.08, cy - radius * 0.48);
  ctx.lineTo(cx - radius * 0.14, cy + radius * 0.02);
  ctx.lineTo(cx + radius * 0.03, cy + radius * 0.02);
  ctx.lineTo(cx - radius * 0.1, cy + radius * 0.5);
  ctx.lineTo(cx + radius * 0.16, cy - radius * 0.04);
  ctx.lineTo(cx - radius * 0.01, cy - radius * 0.04);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function createGreekDoorTextures(side: 'left' | 'right'): DoorTextureSet {
  const w = 512;
  const h = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, w, h);
  baseGrad.addColorStop(0, '#2a1e0e');
  baseGrad.addColorStop(0.28, '#3f2d16');
  baseGrad.addColorStop(0.55, '#251a0c');
  baseGrad.addColorStop(0.82, '#49351c');
  baseGrad.addColorStop(1, '#1d1409');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#505050';
  bCtx.fillRect(0, 0, w, h);

  for (let i = 0; i < 420; i++) {
    const gy = (i / 420) * h;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(244, 213, 138, 0.022)' : 'rgba(5, 5, 5, 0.04)';
    ctx.fillRect(0, gy, w, 2);
  }

  const frameGrad = ctx.createLinearGradient(0, 0, w, h);
  frameGrad.addColorStop(0, '#A8792A');
  frameGrad.addColorStop(0.32, '#F4D58A');
  frameGrad.addColorStop(0.54, '#D6A64B');
  frameGrad.addColorStop(0.78, '#FFF2C6');
  frameGrad.addColorStop(1, '#A8792A');

  const pad = 20;
  ctx.strokeStyle = frameGrad;
  ctx.lineWidth = 18;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  ctx.strokeStyle = '#6e4e1c';
  ctx.lineWidth = 4;
  ctx.strokeRect(pad + 14, pad + 14, w - (pad + 14) * 2, h - (pad + 14) * 2);

  bCtx.strokeStyle = '#e8e8e8';
  bCtx.lineWidth = 18;
  bCtx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  drawGreekKeyHorizontal(ctx, 44, 52, w - 88, 9, '#E9B65A', 3.4);
  drawGreekKeyHorizontal(ctx, 44, h - 74, w - 88, 9, '#E9B65A', 3.4);
  drawGreekKeyHorizontal(bCtx, 44, 52, w - 88, 9, '#d8d8d8', 3.4);
  drawGreekKeyHorizontal(bCtx, 44, h - 74, w - 88, 9, '#d8d8d8', 3.4);

  const panels = [
    { x: 56, y: 108, pw: w - 112, ph: 344 },
    { x: 56, y: 572, pw: w - 112, ph: 344 },
  ];

  panels.forEach((p) => {
    const panelGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.pw, p.y + p.ph);
    panelGrad.addColorStop(0, '#140e07');
    panelGrad.addColorStop(0.5, '#261b0e');
    panelGrad.addColorStop(1, '#100b05');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(p.x, p.y, p.pw, p.ph);

    bCtx.fillStyle = '#282828';
    bCtx.fillRect(p.x, p.y, p.pw, p.ph);

    ctx.strokeStyle = frameGrad;
    ctx.lineWidth = 8;
    ctx.strokeRect(p.x, p.y, p.pw, p.ph);

    ctx.strokeStyle = '#A8792A';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(p.x + 14, p.y + 14, p.pw - 28, p.ph - 28);

    bCtx.strokeStyle = '#f0f0f0';
    bCtx.lineWidth = 8;
    bCtx.strokeRect(p.x, p.y, p.pw, p.ph);

    const corners = [
      [p.x + 26, p.y + 26],
      [p.x + p.pw - 26, p.y + 26],
      [p.x + 26, p.y + p.ph - 26],
      [p.x + p.pw - 26, p.y + p.ph - 26],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#F4D58A';
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = '#ffffff';
      bCtx.beginPath();
      bCtx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      bCtx.fill();
    });

    const cx = p.x + p.pw * 0.5;
    const cy = p.y + p.ph * 0.5;
    ctx.strokeStyle = 'rgba(214, 166, 75, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, p.y + 34);
    ctx.lineTo(p.x + p.pw - 34, cy);
    ctx.lineTo(cx, p.y + p.ph - 34);
    ctx.lineTo(p.x + 34, cy);
    ctx.closePath();
    ctx.stroke();

    drawLaurelSpray(ctx, cx, cy, 86, 'rgba(214, 166, 75, 0.62)');
    drawLaurelSpray(bCtx, cx, cy, 86, '#b8b8b8');
  });

  ctx.fillStyle = '#332412';
  ctx.fillRect(36, 466, w - 72, 92);
  ctx.strokeStyle = frameGrad;
  ctx.lineWidth = 5;
  ctx.strokeRect(36, 466, w - 72, 92);

  const seamX = side === 'left' ? w : 0;
  const seamY = h * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(seamX, seamY, 134, 0, Math.PI * 2);
  ctx.fillStyle = '#1d1409';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = frameGrad;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(seamX, seamY, 114, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#F4D58A';
  ctx.stroke();
  ctx.restore();

  bCtx.save();
  bCtx.beginPath();
  bCtx.arc(seamX, seamY, 134, 0, Math.PI * 2);
  bCtx.lineWidth = 12;
  bCtx.strokeStyle = '#ffffff';
  bCtx.stroke();
  bCtx.restore();

  const seamEdgeX = side === 'left' ? w - 6 : 0;
  ctx.fillStyle = '#D6A64B';
  ctx.fillRect(seamEdgeX, 0, 6, h);

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 4;
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;
  bumpMap.needsUpdate = true;

  return {
    colorMap,
    bumpMap,
    dispose: () => {
      colorMap.dispose();
      bumpMap.dispose();
    },
  };
}
