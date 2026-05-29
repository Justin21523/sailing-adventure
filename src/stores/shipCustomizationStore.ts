/**
 * shipCustomizationStore.ts
 * Manages visual customization options for the player's ship.
 */

import { create } from 'zustand';

export interface ShipCustomizationState {
  sailColor: string;
  
  setSailColor: (color: string) => void;
}

export const useShipCustomizationStore = create<ShipCustomizationState>((set) => ({
  sailColor: '#F5F5DC', // Default off-white
  
  setSailColor: (color) => set({ sailColor: color }),
}));