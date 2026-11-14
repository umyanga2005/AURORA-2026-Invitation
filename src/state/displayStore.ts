import { create } from 'zustand';
import { createInitialEngineState } from '../config/defaults';
import type { SharedEngineState } from '../types/engine';

interface DisplayStoreState {
  engineState: SharedEngineState;
  operatorConnected: boolean;
  lastOperatorSeenAt: number;
  setEngineState: (state: SharedEngineState) => void;
  setOperatorConnected: (connected: boolean) => void;
}

export const useDisplayStore = create<DisplayStoreState>((set) => ({
  engineState: createInitialEngineState(1),
  operatorConnected: false,
  lastOperatorSeenAt: 0,
  setEngineState: (engineState) => set({ engineState }),
  setOperatorConnected: (operatorConnected) =>
    set({
      operatorConnected,
      lastOperatorSeenAt: operatorConnected ? Date.now() : 0,
    }),
}));
