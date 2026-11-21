import type { SoundConfig } from '../types/invitation';

class InvitationAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private crackleGain: GainNode | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleTimer: number | null = null;
  private lastSparkTime = 0;
  private isCrackleRunning = false;
  private currentConfig: SoundConfig = {
    enabled: true,
    masterVolume: 0.75,
    ignitionSound: true,
    crackleSound: true,
    writingSound: true,
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (!this.noiseBuffer && this.ctx) {
      this.noiseBuffer = this.createNoiseBuffer(this.ctx, 3.0);
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    // Pink-ish noise for warm natural flame tone
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.18) * 1.4));
    }
    return buffer;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public updateConfig(config: SoundConfig): void {
    this.currentConfig = config;
    if (this.crackleGain && this.ctx) {
      const target =
        config.enabled && config.crackleSound && this.isCrackleRunning
          ? 0.14 * config.masterVolume
          : 0.0001;
      this.crackleGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.18);
    }
  }

  public playIgnitionWhoosh(config: SoundConfig = this.currentConfig): void {
    this.currentConfig = config;
    if (!config.enabled || !config.ignitionSound || config.masterVolume <= 0.01) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const vol = config.masterVolume;

    // 1. Filtered noise whoosh sweep
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.1, now);
    filter.frequency.setValueAtTime(110, now);
    filter.frequency.exponentialRampToValueAtTime(980, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(240, now + 1.55);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.55 * vol, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 1.7);

    // 2. Warm sub-bass ignition thump
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(82, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.65);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.32 * vol, now + 0.06);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.75);
  }

  public startFireCrackle(config: SoundConfig = this.currentConfig): void {
    this.currentConfig = config;
    this.isCrackleRunning = true;
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    if (!this.crackleSource) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 340;

      const gain = ctx.createGain();
      const target =
        config.enabled && config.crackleSound ? 0.14 * config.masterVolume : 0.0001;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.6);

      src.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);
      src.start();

      this.crackleSource = src;
      this.crackleGain = gain;
    } else {
      this.updateConfig(config);
    }

    if (this.crackleTimer === null) {
      this.scheduleEmberPop();
    }
  }

  private scheduleEmberPop(): void {
    if (!this.isCrackleRunning) {
      this.crackleTimer = null;
      return;
    }
    const delayMs = 260 + Math.random() * 780;
    this.crackleTimer = window.setTimeout(() => {
      this.playEmberPop();
      this.scheduleEmberPop();
    }, delayMs);
  }

  private playEmberPop(): void {
    const cfg = this.currentConfig;
    if (!cfg.enabled || !cfg.crackleSound || cfg.masterVolume <= 0.01) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const startFreq = 1200 + Math.random() * 2400;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.032);

    const g = ctx.createGain();
    const peak = (0.018 + Math.random() * 0.025) * cfg.masterVolume;
    g.gain.setValueAtTime(peak, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.042);
  }

  public stopFireCrackle(): void {
    this.isCrackleRunning = false;
    if (this.crackleTimer !== null) {
      window.clearTimeout(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.crackleGain && this.ctx) {
      this.crackleGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
    }
    if (this.crackleSource) {
      const src = this.crackleSource;
      this.crackleSource = null;
      this.crackleGain = null;
      window.setTimeout(() => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore already stopped
        }
      }, 350);
    }
  }

  public playWritingSpark(config: SoundConfig = this.currentConfig): void {
    this.currentConfig = config;
    if (!config.enabled || !config.writingSound || config.masterVolume <= 0.01) return;

    const perfNow = performance.now();
    if (perfNow - this.lastSparkTime < 75) return;
    this.lastSparkTime = perfNow;

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const vol = config.masterVolume;

    // Soft golden crystalline shimmer tick
    const notes = [880, 987.77, 1174.66, 1318.51, 1479.98, 1760];
    const freq = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.07);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.022 * vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playLogoCompleteChime(config: SoundConfig = this.currentConfig): void {
    this.currentConfig = config;
    if (!config.enabled || !config.writingSound || config.masterVolume <= 0.01) return;

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const vol = config.masterVolume;
    const chord = [587.33, 739.99, 880.0, 1174.66]; // D major golden chord

    chord.forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.055 * vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  // =========================================================
  // PHASE 03 — THE GATES OF OLYMPUS CINEMATIC AUDIO
  // =========================================================

  public playEntranceEmblemChime(config: SoundConfig = this.currentConfig): void {
    try {
      this.currentConfig = config;
      if (!config.enabled || config.masterVolume <= 0.01) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = config.masterVolume;
      // Majestic Greek golden fifth + octave chime
      const tones = [440.0, 659.25, 880.0, 1318.51];

      tones.forEach((freq, idx) => {
        const t = now + idx * 0.055;
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime((idx < 2 ? 0.075 : 0.042) * vol, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.85);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.9);
      });
    } catch {
      // Never block entrance on audio error
    }
  }

  public playDistantThunder(config: SoundConfig = this.currentConfig): void {
    try {
      this.currentConfig = config;
      if (!config.enabled || config.masterVolume <= 0.01) return;
      const ctx = this.ensureContext();
      if (!ctx || !this.noiseBuffer) return;

      const now = ctx.currentTime;
      const vol = config.masterVolume;

      // Restrained distant atmospheric rumble (not loud horror thunder)
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, now);
      filter.frequency.exponentialRampToValueAtTime(95, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(52, now + 3.0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.24 * vol, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.18 * vol, now + 1.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 3.15);
    } catch {
      // Never block entrance on audio error
    }
  }

  public playHeavyDoorsOpening(config: SoundConfig = this.currentConfig): void {
    try {
      this.currentConfig = config;
      if (!config.enabled || config.masterVolume <= 0.01) return;
      const ctx = this.ensureContext();
      if (!ctx || !this.noiseBuffer) return;

      const now = ctx.currentTime;
      const vol = config.masterVolume;

      // Deep bronze & stone temple door rotation resonance
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(2.4, now);
      bandpass.frequency.setValueAtTime(115, now);
      bandpass.frequency.linearRampToValueAtTime(185, now + 1.4);
      bandpass.frequency.linearRampToValueAtTime(92, now + 2.8);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.2 * vol, now + 0.45);
      g.gain.linearRampToValueAtTime(0.16 * vol, now + 2.0);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.95);

      noise.connect(bandpass);
      bandpass.connect(g);
      g.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 3.0);

      // Subtle low monumental harmonic drone
      const drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(73.42, now); // D2
      drone.frequency.linearRampToValueAtTime(65.41, now + 2.7); // C2

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, now);
      droneGain.gain.linearRampToValueAtTime(0.14 * vol, now + 0.5);
      droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.85);

      drone.connect(droneGain);
      droneGain.connect(ctx.destination);
      drone.start(now);
      drone.stop(now + 2.9);
    } catch {
      // Never block entrance on audio error
    }
  }

  public playDivineLightReveal(config: SoundConfig = this.currentConfig): void {
    try {
      this.currentConfig = config;
      if (!config.enabled || config.masterVolume <= 0.01) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = config.masterVolume;

      // Ethereal warm golden pad chord (D4, A4, D5, F#5)
      const chord = [293.66, 440.0, 587.33, 739.99];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime((idx < 2 ? 0.05 : 0.032) * vol, now + 0.65);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.65);
      });
    } catch {
      // Never block entrance on audio error
    }
  }
}

export const audioEngine = new InvitationAudioEngine();
