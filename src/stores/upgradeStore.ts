/**
 * upgradeStore.ts
 * Manages ship upgrade levels and the UI state of the Shipwright shop.
 */

import { create } from 'zustand';

export type UpgradeType = 'hull' | 'sails' | 'rudder';

export interface UpgradeLevels {
  hull: number;
  sails: number;
  rudder: number;
}

export interface UpgradeState {
  levels: UpgradeLevels;
  isShopOpen: boolean;
  
  incrementLevel: (type: UpgradeType) => void;
  toggleShop: () => void;
  closeShop: () => void;
}

export const useUpgradeStore = create<UpgradeState>((set) => ({
  levels: { hull: 0, sails: 0, rudder: 0 },
  isShopOpen: false,
  
  incrementLevel: (type) => set((state) => ({
    levels: { ...state.levels, [type]: state.levels[type] + 1 }
  })),
  
  toggleShop: () => set((state) => ({ isShopOpen: !state.isShopOpen })),
  closeShop: () => set({ isShopOpen: false }),
}));