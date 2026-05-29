/**
 * CrewManager.ts
 * Manages crew recruitment and role assignment.
 * Provides global multipliers to ship physics and combat systems.
 */

import { useGameStore } from '@/stores/gameStore';

export type CrewRole = 'GUNNER' | 'SAILOR' | 'CARPENTER';

export interface CrewState {
  total: number;
  assigned: Record<CrewRole, number>;
}

export class CrewManager {
  public state: CrewState = {
    total: 5, 
    assigned: { GUNNER: 2, SAILOR: 2, CARPENTER: 1 }
  };

  public assign(role: CrewRole, amount: number): void {
    const current = this.state.assigned[role];
    const newValue = Math.max(0, current + amount);
    const unassigned = this.getUnassigned();
    
    if (amount > 0 && amount > unassigned) return;
    this.state.assigned[role] = newValue;
  }

  public getUnassigned(): number {
    const used = Object.values(this.state.assigned).reduce((a, b) => a + b, 0);
    return this.state.total - used;
  }

  public getModifiers(): { speedMult: number, reloadMult: number, repairRate: number } {
    const { GUNNER, SAILOR, CARPENTER } = this.state.assigned;
    return {
      speedMult: 1.0 + (SAILOR * 0.05), 
      reloadMult: Math.max(0.5, 1.0 - (GUNNER * 0.05)), 
      repairRate: CARPENTER * 2.0 
    };
  }

  public hire(amount: number, costPerCrew: number): boolean {
    const store = useGameStore.getState();
    const totalCost = amount * costPerCrew;
    if (store.resources.gold >= totalCost) {
      store.spendResource('gold', totalCost);
      this.state.total += amount;
      return true;
    }
    return false;
  }
}

export const crewManager = new CrewManager();