export interface FlameColorPalette {
  id: string;
  label: string;
  glow: [number, number, number];
  outer: [number, number, number];
  mid: [number, number, number];
  inner: [number, number, number];
  core: [number, number, number];
  lampGlow: [number, number, number];
  accentHex: string;
}

export const DEFAULT_FLAME_COLOR_ID = 'classic-gold';

export const FLAME_COLOR_PRESETS: FlameColorPalette[] = [
  {
    id: 'classic-gold',
    label: 'Classic Gold (Default)',
    glow: [0.75, 0.2, 0.02],
    outer: [0.95, 0.26, 0.02],
    mid: [1.0, 0.54, 0.07],
    inner: [1.0, 0.84, 0.24],
    core: [1.0, 0.98, 0.86],
    lampGlow: [1.0, 0.58, 0.12],
    accentHex: '#f59e0b',
  },
  {
    id: 'royal-blue',
    label: 'Royal Blue',
    glow: [0.03, 0.22, 0.75],
    outer: [0.06, 0.38, 0.95],
    mid: [0.12, 0.65, 1.0],
    inner: [0.42, 0.86, 1.0],
    core: [0.88, 0.96, 1.0],
    lampGlow: [0.2, 0.6, 1.0],
    accentHex: '#3b82f6',
  },
  {
    id: 'emerald-green',
    label: 'Emerald Green',
    glow: [0.02, 0.45, 0.2],
    outer: [0.05, 0.75, 0.25],
    mid: [0.2, 0.95, 0.4],
    inner: [0.65, 1.0, 0.7],
    core: [0.9, 1.0, 0.92],
    lampGlow: [0.25, 0.9, 0.45],
    accentHex: '#10b981',
  },
  {
    id: 'amethyst-violet',
    label: 'Amethyst Violet',
    glow: [0.4, 0.05, 0.65],
    outer: [0.65, 0.1, 0.9],
    mid: [0.82, 0.35, 1.0],
    inner: [0.92, 0.7, 1.0],
    core: [0.98, 0.92, 1.0],
    lampGlow: [0.75, 0.35, 1.0],
    accentHex: '#a855f7',
  },
  {
    id: 'ruby-crimson',
    label: 'Ruby Crimson',
    glow: [0.6, 0.02, 0.04],
    outer: [0.9, 0.05, 0.08],
    mid: [1.0, 0.22, 0.15],
    inner: [1.0, 0.58, 0.45],
    core: [1.0, 0.9, 0.88],
    lampGlow: [1.0, 0.25, 0.2],
    accentHex: '#ef4444',
  },
  {
    id: 'celestial-white',
    label: 'Celestial Silver',
    glow: [0.25, 0.35, 0.45],
    outer: [0.55, 0.65, 0.75],
    mid: [0.8, 0.88, 0.95],
    inner: [0.92, 0.96, 1.0],
    core: [1.0, 1.0, 1.0],
    lampGlow: [0.7, 0.82, 0.95],
    accentHex: '#cbd5e1',
  },
];

export function getFlamePalette(id: string, customPalette?: FlameColorPalette): FlameColorPalette {
  if (id === 'custom' && customPalette) {
    return customPalette;
  }
  const found = FLAME_COLOR_PRESETS.find((p) => p.id === id);
  return found || FLAME_COLOR_PRESETS[0];
}

/**
 * Generate a harmonious 5-tier flame ramp from a single base color hex
 */
export function generatePaletteFromHex(hex: string, label = 'Custom Color'): FlameColorPalette {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  return {
    id: 'custom',
    label,
    glow: [Math.max(0, r * 0.5), Math.max(0, g * 0.5), Math.max(0, b * 0.5)],
    outer: [Math.max(0, r * 0.8), Math.max(0, g * 0.8), Math.max(0, b * 0.8)],
    mid: [r, g, b],
    inner: [
      Math.min(1, r + (1 - r) * 0.65),
      Math.min(1, g + (1 - g) * 0.65),
      Math.min(1, b + (1 - b) * 0.65),
    ],
    core: [
      Math.min(1, r + (1 - r) * 0.92),
      Math.min(1, g + (1 - g) * 0.92),
      Math.min(1, b + (1 - b) * 0.92),
    ],
    lampGlow: [r, g, b],
    accentHex: hex,
  };
}
