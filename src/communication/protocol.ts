import type { FlameColorPalette } from '../config/flameColors';
import type { FlamePresetLevel } from '../types/flame';
import type { SharedEngineState } from '../types/engine';

export type SyncMessageType =
  | 'DISPLAY_READY'
  | 'STATE_REQUEST'
  | 'STATE_SNAPSHOT'
  | 'RELEASE_SPARK'
  | 'SPARK_STARTED'
  | 'SPARK_IMPACTED'
  | 'START_AUTO'
  | 'STOP_AUTO'
  | 'SET_FLAME_LEVEL'
  | 'SET_FLAME_HEIGHT'
  | 'SET_FLAME_INTENSITY'
  | 'SET_FLAME_COLOR'
  | 'SET_SPARK_SETTINGS'
  | 'FULL_FLAME'
  | 'PAUSE'
  | 'RESUME'
  | 'EXTINGUISH'
  | 'RESET'
  | 'CONNECTION_PING'
  | 'CONNECTION_PONG';

export type WindowRole = 'operator' | 'display';

export interface BaseSyncMessage<T extends SyncMessageType, P = undefined> {
  type: T;
  eventId: string;
  cycleId: number;
  sender: WindowRole;
  timestamp: number;
  payload: P;
}

export type SyncMessage =
  | BaseSyncMessage<'DISPLAY_READY', { version: string }>
  | BaseSyncMessage<'STATE_REQUEST', { requester: WindowRole }>
  | BaseSyncMessage<'STATE_SNAPSHOT', { state: SharedEngineState }>
  | BaseSyncMessage<'RELEASE_SPARK', { sparkId: string; sparkSpeed: number }>
  | BaseSyncMessage<'SPARK_STARTED', { sparkId: string; inFlightSparks: number }>
  | BaseSyncMessage<
      'SPARK_IMPACTED',
      {
        sparkId: string;
        completedSparks: number;
        inFlightSparks: number;
        progress: number;
        flameHeight: number;
        flameIntensity: number;
        status: SharedEngineState['status'];
      }
    >
  | BaseSyncMessage<
      'START_AUTO',
      { requiredSparks: number; autoIntervalSec: number; sparkSpeed: number }
    >
  | BaseSyncMessage<'STOP_AUTO', undefined>
  | BaseSyncMessage<'SET_FLAME_LEVEL', { level: Exclude<FlamePresetLevel, 'OFF'> }>
  | BaseSyncMessage<'SET_FLAME_HEIGHT', { height: number }>
  | BaseSyncMessage<'SET_FLAME_INTENSITY', { intensity: number }>
  | BaseSyncMessage<
      'SET_FLAME_COLOR',
      { paletteId: string; customPalette?: FlameColorPalette }
    >
  | BaseSyncMessage<
      'SET_SPARK_SETTINGS',
      { requiredSparks?: number; autoIntervalSec?: number; sparkSpeed?: number }
    >
  | BaseSyncMessage<'FULL_FLAME', { durationSec: number }>
  | BaseSyncMessage<'PAUSE', undefined>
  | BaseSyncMessage<'RESUME', undefined>
  | BaseSyncMessage<'EXTINGUISH', undefined>
  | BaseSyncMessage<'RESET', { nextCycleId: number }>
  | BaseSyncMessage<'CONNECTION_PING', { sender: WindowRole }>
  | BaseSyncMessage<'CONNECTION_PONG', { sender: WindowRole }>;

let eventSeq = 0;

export function createEventId(prefix = 'evt'): string {
  eventSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${eventSeq.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function createSyncMessage<T extends SyncMessage['type']>(
  type: T,
  sender: WindowRole,
  cycleId: number,
  payload: Extract<SyncMessage, { type: T }>['payload']
): Extract<SyncMessage, { type: T }> {
  return {
    type,
    eventId: createEventId(type.toLowerCase()),
    cycleId,
    sender,
    timestamp: Date.now(),
    payload,
  } as Extract<SyncMessage, { type: T }>;
}
