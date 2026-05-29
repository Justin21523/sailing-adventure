/**
 * uiStore.ts
 * Manages global UI states that are not tied to specific game entities.
 * Handles Pause Menu, Docking prompts, and Game Over screens.
 */

import { create } from 'zustand';

export type InteractionPromptType = 'DOCK' | 'REPAIR' | 'NONE';

export interface UIState {
  isPaused: boolean;
  isDocked: boolean;
  showGameOver: boolean;
  activePrompt: InteractionPromptType;
  targetIslandId: string | null;
  activeMerchantId: string | null;

  togglePause: () => void;
  pause: () => void;
  resume: () => void;
  setDocked: (docked: boolean, islandId?: string | null) => void;
  setPrompt: (prompt: InteractionPromptType, islandId?: string | null) => void;
  setActiveMerchant: (id: string | null) => void;
  triggerGameOver: () => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPaused: false,
  isDocked: false,
  showGameOver: false,
  activePrompt: 'NONE',
  targetIslandId: null,
  activeMerchantId: null,

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  
  setDocked: (docked, islandId = null) => set({ 
    isDocked: docked, 
    targetIslandId: islandId,
    activePrompt: docked ? 'REPAIR' : 'NONE'
  }),
  
  setPrompt: (prompt, islandId = null) => set((state) => ({
    activePrompt: prompt,
    targetIslandId: prompt === 'NONE' ? null : islandId ?? state.targetIslandId,
  })),
  
  triggerGameOver: () => set({ showGameOver: true, isPaused: true }),
  
  resetUI: () => set({
    isPaused: false,
    isDocked: false,
    showGameOver: false,
    activePrompt: 'NONE',
    targetIslandId: null,
    activeMerchantId: null,
  }),
}));
