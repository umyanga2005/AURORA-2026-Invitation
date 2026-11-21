export type InvitationPhase =
  | 'EXTINGUISHED'
  | 'IGNITING'
  | 'WRITING_LOGO'
  | 'TRANSITIONING'
  | 'TYPING_INVITATION'
  | 'COMPLETE';

export interface InvitationTextConfig {
  logoMain: string;
  logoSub: string;
  headerLine1: string;
  headerLine2: string;
  eventTitle: string;
  dateLabel: string;
  dateValue: string;
  timeLabel: string;
  timeValue: string;
  venueLabel: string;
  venueValue: string;
  footerLine: string;
  typingSpeedMs: number;
}

export interface SoundConfig {
  enabled: boolean;
  masterVolume: number;
  ignitionSound: boolean;
  crackleSound: boolean;
  writingSound: boolean;
}

export interface InvitationConfig {
  text: InvitationTextConfig;
  sound: SoundConfig;
}
