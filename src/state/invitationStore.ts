import { create } from 'zustand';
import type { InvitationConfig, InvitationTextConfig, SoundConfig } from '../types/invitation';

const STORAGE_KEY = 'aurora_invitation_config_v1';

export const DEFAULT_INVITATION_TEXT: InvitationTextConfig = {
  logoMain: 'AURORA',
  logoSub: 'MMXXVI',
  headerLine1: 'The English Literary Association of RNCOE',
  headerLine2: 'cordially invites you to',
  eventTitle: 'The 22nd Annual English Day',
  dateLabel: 'Date',
  dateValue: '2026.11.30',
  timeLabel: 'Time',
  timeValue: '1.00pm - 4.00pm',
  venueLabel: 'Venue',
  venueValue: 'RNCOE Auditorium',
  footerLine: 'Let the golden flame of eloquence illuminate our path.',
  typingSpeedMs: 42,
};

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  masterVolume: 0.75,
  ignitionSound: true,
  crackleSound: true,
  writingSound: true,
};

export const DEFAULT_INVITATION_CONFIG: InvitationConfig = {
  text: { ...DEFAULT_INVITATION_TEXT },
  sound: { ...DEFAULT_SOUND_CONFIG },
};

function loadConfig(): InvitationConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_INVITATION_CONFIG);
    const parsed = JSON.parse(raw) as Partial<InvitationConfig>;
    return {
      text: { ...DEFAULT_INVITATION_TEXT, ...(parsed.text ?? {}) },
      sound: { ...DEFAULT_SOUND_CONFIG, ...(parsed.sound ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_INVITATION_CONFIG);
  }
}

function saveConfig(config: InvitationConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

interface InvitationStoreState {
  config: InvitationConfig;
  setConfig: (config: InvitationConfig) => void;
  updateText: (partial: Partial<InvitationTextConfig>) => InvitationConfig;
  updateSound: (partial: Partial<SoundConfig>) => InvitationConfig;
  resetTextDefaults: () => InvitationConfig;
  resetSoundDefaults: () => InvitationConfig;
}

export const useInvitationStore = create<InvitationStoreState>((set, get) => ({
  config: typeof window !== 'undefined' ? loadConfig() : structuredClone(DEFAULT_INVITATION_CONFIG),

  setConfig: (config) => {
    const merged: InvitationConfig = {
      text: { ...DEFAULT_INVITATION_TEXT, ...config.text },
      sound: { ...DEFAULT_SOUND_CONFIG, ...config.sound },
    };
    saveConfig(merged);
    set({ config: merged });
  },

  updateText: (partial) => {
    const next: InvitationConfig = {
      ...get().config,
      text: { ...get().config.text, ...partial },
    };
    saveConfig(next);
    set({ config: next });
    return next;
  },

  updateSound: (partial) => {
    const next: InvitationConfig = {
      ...get().config,
      sound: { ...get().config.sound, ...partial },
    };
    saveConfig(next);
    set({ config: next });
    return next;
  },

  resetTextDefaults: () => {
    const next: InvitationConfig = {
      ...get().config,
      text: { ...DEFAULT_INVITATION_TEXT },
    };
    saveConfig(next);
    set({ config: next });
    return next;
  },

  resetSoundDefaults: () => {
    const next: InvitationConfig = {
      ...get().config,
      sound: { ...DEFAULT_SOUND_CONFIG },
    };
    saveConfig(next);
    set({ config: next });
    return next;
  },
}));
