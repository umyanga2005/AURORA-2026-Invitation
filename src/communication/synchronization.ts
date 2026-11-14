import { FlameSyncChannel } from './channel';
import { createSyncMessage, type SyncMessage } from './protocol';
import type { ProgressiveIgnitionController } from '../engine/IgnitionController';
import { useDisplayStore } from '../state/displayStore';
import { useOperatorStore } from '../state/operatorStore';

/**
 * Connects the Display's ProgressiveIgnitionController to BroadcastChannel.
 */
export function attachDisplaySync(controller: ProgressiveIgnitionController) {
  const channel = new FlameSyncChannel();
  const bootedAt = Date.now();
  let lastOperatorPing = 0;

  const unsubscribe = channel.subscribe((msg: SyncMessage) => {
    if (msg.sender === 'display') return;

    lastOperatorPing = Date.now();
    useDisplayStore.getState().setOperatorConnected(true);

    switch (msg.type) {
      case 'CONNECTION_PING':
        channel.send(
          createSyncMessage('CONNECTION_PONG', 'display', controller.getCycleId(), {
            sender: 'display',
          })
        );
        break;

      case 'STATE_REQUEST':
        // If Display just booted (< 400ms) and is still IDLE, let Operator restore state if it has one;
        // otherwise Display sends its authoritative live state.
        if (Date.now() - bootedAt > 400 || controller.getSnapshot().status !== 'IDLE') {
          channel.send(
            createSyncMessage('STATE_SNAPSHOT', 'display', controller.getCycleId(), {
              state: controller.getSnapshot(),
            })
          );
        }
        break;

      case 'STATE_SNAPSHOT':
        // Operator restoring state onto a freshly reloaded Display
        if (
          Date.now() - bootedAt < 2000 &&
          controller.getSnapshot().status === 'IDLE' &&
          controller.getSnapshot().completedSparks === 0
        ) {
          controller.applySnapshot(msg.payload.state);
          useDisplayStore.getState().setEngineState(controller.getSnapshot());
        }
        break;

      case 'RELEASE_SPARK':
        controller.releaseSpark(msg.payload.sparkId, msg.cycleId, msg.payload.sparkSpeed);
        break;

      case 'START_AUTO':
        controller.startAuto(
          msg.payload.requiredSparks,
          msg.payload.autoIntervalSec,
          msg.payload.sparkSpeed
        );
        break;

      case 'STOP_AUTO':
        controller.stopAuto();
        break;

      case 'SET_FLAME_LEVEL':
        controller.setFlameLevel(msg.payload.level);
        break;

      case 'SET_FLAME_HEIGHT':
        controller.setFlameHeight(msg.payload.height);
        break;

      case 'SET_FLAME_INTENSITY':
        controller.setFlameIntensity(msg.payload.intensity);
        break;

      case 'SET_FLAME_COLOR':
        controller.setFlameColor(msg.payload.paletteId, msg.payload.customPalette);
        break;

      case 'SET_SPARK_SETTINGS':
        controller.updateSparkSettings(msg.payload);
        break;

      case 'FULL_FLAME':
        controller.triggerFullFlame(msg.payload.durationSec);
        break;

      case 'PAUSE':
        controller.pause();
        break;

      case 'RESUME':
        controller.resume();
        break;

      case 'EXTINGUISH':
        controller.extinguish();
        break;

      case 'RESET':
        controller.reset(msg.payload.nextCycleId);
        break;
    }
  });

  // Announce display readiness and request any existing state from operator
  channel.send(
    createSyncMessage('DISPLAY_READY', 'display', controller.getCycleId(), {
      version: '1.0.0',
    })
  );
  channel.send(
    createSyncMessage('STATE_REQUEST', 'display', controller.getCycleId(), {
      requester: 'display',
    })
  );

  // Heartbeat check
  const heartbeat = window.setInterval(() => {
    if (lastOperatorPing > 0 && Date.now() - lastOperatorPing > 6000) {
      useDisplayStore.getState().setOperatorConnected(false);
    }
  }, 2000);

  return {
    channel,
    dispose: () => {
      window.clearInterval(heartbeat);
      unsubscribe();
      channel.close();
    },
  };
}

/**
 * Connects the Operator Dashboard to BroadcastChannel.
 */
export function createOperatorSyncClient() {
  const channel = new FlameSyncChannel();
  let lastDisplaySeen = 0;

  const unsubscribe = channel.subscribe((msg: SyncMessage) => {
    if (msg.sender === 'operator') return;

    lastDisplaySeen = Date.now();
    const store = useOperatorStore.getState();
    store.setDisplayConnected(true);

    switch (msg.type) {
      case 'DISPLAY_READY': {
        const current = store.engineState;
        if (current.status !== 'IDLE' || current.completedSparks > 0 || current.requiredSparks !== 20) {
          channel.send(
            createSyncMessage('STATE_SNAPSHOT', 'operator', current.cycleId, {
              state: current,
            })
          );
        }
        break;
      }

      case 'STATE_REQUEST': {
        const current = store.engineState;
        if (current.status !== 'IDLE' || current.completedSparks > 0) {
          channel.send(
            createSyncMessage('STATE_SNAPSHOT', 'operator', current.cycleId, {
              state: current,
            })
          );
        }
        break;
      }

      case 'STATE_SNAPSHOT':
        store.applySnapshot(msg.payload.state);
        break;

      case 'SPARK_STARTED':
        store.markSparkStarted(msg.cycleId, msg.payload.inFlightSparks);
        break;

      case 'SPARK_IMPACTED':
        store.markSparkImpacted(msg.cycleId, msg.payload.sparkId, msg.payload);
        break;

      case 'CONNECTION_PONG':
        break;
    }
  });

  // Initial ping & state request on operator mount (handles reload without starting new cycle)
  const initialCycleId = useOperatorStore.getState().engineState.cycleId;
  channel.send(
    createSyncMessage('CONNECTION_PING', 'operator', initialCycleId, { sender: 'operator' })
  );
  channel.send(
    createSyncMessage('STATE_REQUEST', 'operator', initialCycleId, { requester: 'operator' })
  );

  const pingInterval = window.setInterval(() => {
    const cycleId = useOperatorStore.getState().engineState.cycleId;
    channel.send(
      createSyncMessage('CONNECTION_PING', 'operator', cycleId, { sender: 'operator' })
    );
    if (lastDisplaySeen > 0 && Date.now() - lastDisplaySeen > 6000) {
      useOperatorStore.getState().setDisplayConnected(false);
    }
  }, 2000);

  return {
    channel,
    dispose: () => {
      window.clearInterval(pingInterval);
      unsubscribe();
      channel.close();
    },
  };
}
