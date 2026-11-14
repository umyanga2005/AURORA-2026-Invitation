import { BROADCAST_CHANNEL_NAME } from '../config/defaults';
import type { SyncMessage } from './protocol';

export type MessageHandler = (message: SyncMessage) => void;

export class FlameSyncChannel {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<MessageHandler>();
  private seenEventIds = new Set<string>();
  private maxSeenIds = 500;

  constructor(channelName = BROADCAST_CHANNEL_NAME) {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const msg = event.data;
        if (!msg || typeof msg.type !== 'string' || !msg.eventId) return;
        if (this.seenEventIds.has(msg.eventId)) return;
        this.recordEventId(msg.eventId);
        this.listeners.forEach((handler) => handler(msg));
      };
    }
  }

  private recordEventId(id: string): void {
    this.seenEventIds.add(id);
    if (this.seenEventIds.size > this.maxSeenIds) {
      const first = this.seenEventIds.values().next().value;
      if (first) this.seenEventIds.delete(first);
    }
  }

  public send(message: SyncMessage): void {
    if (!this.channel) return;
    this.channel.postMessage(message);
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public close(): void {
    this.listeners.clear();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
