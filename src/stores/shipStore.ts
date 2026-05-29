/**
 * shipStore.ts
 * Zustand store for ship-related UI state.
 * Strictly updated via the ShipTelemetry bridge to prevent render thrashing.
 */

import { create } from 'zustand';
import type { Vector3Tuple } from '@/types';

export interface ShipState {
  // UI-facing metrics
  hullHealth: number;
  maxHullHealth: number;
  
  // Telemetry data (throttled from physics engine)
  speedKnots: number;
  headingDegrees: number;
  position: Vector3Tuple;
  
  // Cannon Cooldown state for HUD synchronization
  cannonCooldown: number;
  maxCannonCooldown: number;
  
  // Actions
  updateTelemetry: (speed: number, heading: number, pos: Vector3Tuple) => void;
  setCannonCooldown: (current: number, max: number) => void;
  takeDamage: (amount: number) => void;
  repair: (amount: number) => void;
}

export const useShipStore = create<ShipState>((set, get) => ({
  hullHealth: 100,
  maxHullHealth: 100,
  speedKnots: 0,
  headingDegrees: 0,
  position: [0, 0, 0],
  cannonCooldown: 0,
  maxCannonCooldown: 1.5,

  updateTelemetry: (speed, heading, pos) => {
    set({
      speedKnots: speed,
      headingDegrees: heading,
      position: pos,
    });
  },

  setCannonCooldown: (current, max) => {
    set({ cannonCooldown: current, maxCannonCooldown: max });
  },

  takeDamage: (amount) => {
    const { hullHealth } = get();
    const newHealth = Math.max(0, hullHealth - amount);
    set({ hullHealth: newHealth });
  },

  repair: (amount) => {
    const { hullHealth, maxHullHealth } = get();
    const newHealth = Math.min(maxHullHealth, hullHealth + amount);
    set({ hullHealth: newHealth });
  },
}));