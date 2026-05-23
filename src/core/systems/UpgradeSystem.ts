/**
 * UpgradeSystem.ts
 * Handles the logic for purchasing upgrades, deducting resources, 
 * and applying statistical multipliers to the live physics engine.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useUpgradeStore, type UpgradeType } from '@/stores/upgradeStore';
import { useGameStore } from '@/stores/gameStore';
import { useShipStore } from '@/stores/shipStore';

export interface UpgradeCost {
  wood: number;
  gold: number;
  cloth: number;
}

export const UPGRADE_COSTS: Record<UpgradeType, UpgradeCost> = {
  hull: { wood: 20, gold: 10, cloth: 0 },
  sails: { wood: 10, gold: 5, cloth: 15 },
  rudder: { wood: 15, gold: 20, cloth: 5 },
};

export class UpgradeSystem {
  /**
   * Attempts to purchase an upgrade. Returns true if successful, false if insufficient resources.
   */
  public static attemptUpgrade(type: UpgradeType): boolean {
    const cost = UPGRADE_COSTS[type];
    const gameStore = useGameStore.getState();
    const upgradeStore = useUpgradeStore.getState();
    
    // 1. Validate resources
    if (gameStore.resources.wood < cost.wood || 
        gameStore.resources.gold < cost.gold || 
        gameStore.resources.cloth < cost.cloth) {
      return false;
    }

    // 2. Deduct resources
    gameStore.spendResource('wood', cost.wood);
    gameStore.spendResource('gold', cost.gold);
    gameStore.spendResource('cloth', cost.cloth);

    // 3. Increment level
    upgradeStore.incrementLevel(type);
    
    // 4. Apply to physics/stats
    this.applyStats();
    return true;
  }

  /**
   * Recalculates and applies all upgrade multipliers to the live GameWorld physics.
   */
  public static applyStats(): void {
    const levels = useUpgradeStore.getState().levels;
    const physics = gameWorld.shipPhysics;
    
    // Base stats
    const baseMaxSpeed = 15;
    const baseTurnSpeed = 1.8;
    const baseMaxHealth = 100;

    // Apply multipliers
    physics.maxSpeed = baseMaxSpeed + (levels.sails * 2.5);
    physics.acceleration = 4.0 + (levels.sails * 0.5);
    physics.turnSpeed = baseTurnSpeed + (levels.rudder * 0.4);
    
    const newMaxHp = baseMaxHealth + (levels.hull * 25);
    
    // Update Ship Store (Heals to full on upgrade)
    useShipStore.setState({ 
      maxHullHealth: newMaxHp,
      hullHealth: newMaxHp 
    });
  }
}