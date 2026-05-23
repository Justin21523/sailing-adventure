/**
 * settingsStore.ts
 * Manages user preferences and dynamic performance tier adjustments.
 */

import { create } from 'zustand';
import type { PerformanceTier } from '@/types';

export interface SettingsState {
  performanceTier: PerformanceTier;
  postProcessingEnabled: boolean;
  masterVolume: number;
  
  // Actions
  setPerformanceTier: (tier: PerformanceTier) => void;
  togglePostProcessing: () => void;
  setMasterVolume: (volume: number) => void;
  downgradeGraphics: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  performanceTier: 'HIGH',
  postProcessingEnabled: true,
  masterVolume: 0.5,

  setPerformanceTier: (tier) => set({ performanceTier: tier }),
  
  togglePostProcessing: () => set((state) => ({ 
    postProcessingEnabled: !state.postProcessingEnabled 
  })),
  
  setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

  downgradeGraphics: () => {
    const { performanceTier, postProcessingEnabled } = get();
    // Step down the tier if performance is bad
    if (performanceTier === 'ULTRA') set({ performanceTier: 'HIGH' });
    else if (performanceTier === 'HIGH') set({ performanceTier: 'MEDIUM', postProcessingEnabled: false });
    else if (performanceTier === 'MEDIUM') set({ performanceTier: 'LOW', postProcessingEnabled: false });
    
    // Force disable post-processing if we hit LOW
    if (performanceTier === 'LOW' && postProcessingEnabled) {
      set({ postProcessingEnabled: false });
    }
  }
}));