import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameStatus, ResourceInventory, ResourceType } from '@/types';

export interface GameState {
  // Core Game Status
  status: GameStatus;
  
  // Economy & Resources
  resources: ResourceInventory;
  
  // Progression
  currentZoneId: string;
  dayCount: number;
  
  // Actions
  setStatus: (status: GameStatus) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  addResource: (type: ResourceType, amount: number) => void;
  spendResource: (type: ResourceType, amount: number) => boolean;
  advanceDay: () => void;
  resetGame: () => void;
}

const initialResources: ResourceInventory = {
  wood: 50,
  gold: 100,
  cloth: 20,
  rum: 10,
};

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    status: 'INITIALIZING',
    resources: { ...initialResources },
    currentZoneId: 'zone_starting_island',
    dayCount: 1,

    setStatus: (status) => set({ status }),

    pauseGame: () => {
      const { status } = get();
      if (status === 'PLAYING') {
        set({ status: 'PAUSED' });
      }
    },

    resumeGame: () => {
      const { status } = get();
      if (status === 'PAUSED') {
        set({ status: 'PLAYING' });
      }
    },

    addResource: (type, amount) => {
      set((state) => ({
        resources: {
          ...state.resources,
          [type]: Math.max(0, state.resources[type] + amount),
        },
      }));
    },

    spendResource: (type, amount) => {
      const current = get().resources[type];
      if (current >= amount) {
        set((state) => ({
          resources: {
            ...state.resources,
            [type]: state.resources[type] - amount,
          },
        }));
        return true;
      }
      return false;
    },

    advanceDay: () => {
      set((state) => ({
        dayCount: state.dayCount + 1,
      }));
    },

    resetGame: () => {
      set({
        status: 'INITIALIZING',
        resources: { ...initialResources },
        currentZoneId: 'zone_starting_island',
        dayCount: 1,
      });
    },
  }))
);