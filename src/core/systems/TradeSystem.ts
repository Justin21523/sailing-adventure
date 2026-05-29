/**
 * TradeSystem.ts
 * Manages dynamic market prices based on island biomes.
 * Allows players to buy low and sell high to accumulate wealth.
 */

import { type IslandBiome } from '@/core/systems/ChunkManager';
import { useGameStore } from '@/stores/gameStore';
import type { ResourceType } from '@/types';

export interface TradeGood {
  resource: ResourceType;
  buyPrice: number;
  sellPrice: number;
}

export class TradeSystem {
  private basePrices: Record<ResourceType, number> = {
    wood: 5,
    gold: 1, 
    cloth: 8,
    rum: 10
  };

  public getMarketPrices(biome: IslandBiome): TradeGood[] {
    const multipliers: Record<IslandBiome, Record<ResourceType, number>> = {
      FOREST: { wood: 0.5, gold: 1.2, cloth: 1.0, rum: 1.1 }, 
      VOLCANIC: { wood: 2.0, gold: 0.8, cloth: 1.5, rum: 1.2 }, 
      RUINS: { wood: 1.2, gold: 0.5, cloth: 2.0, rum: 1.5 }, 
      SAND_BANK: { wood: 1.5, gold: 1.0, cloth: 0.8, rum: 0.6 }, 
    };

    const mult = multipliers[biome];
    const goods: TradeGood[] = [];
    
    for (const [res, base] of Object.entries(this.basePrices)) {
      const m = mult[res as ResourceType] || 1.0;
      goods.push({
        resource: res as ResourceType,
        buyPrice: Math.round(base * m * 1.2), 
        sellPrice: Math.round(base * m * 0.8), 
      });
    }
    return goods;
  }

  public buy(resource: ResourceType, amount: number, pricePerUnit: number): boolean {
    const store = useGameStore.getState();
    const totalCost = pricePerUnit * amount;
    if (store.resources.gold >= totalCost) {
      store.spendResource('gold', totalCost);
      store.addResource(resource, amount);
      return true;
    }
    return false;
  }

  public sell(resource: ResourceType, amount: number, pricePerUnit: number): boolean {
    const store = useGameStore.getState();
    if (store.resources[resource] >= amount) {
      store.spendResource(resource, amount);
      store.addResource('gold', pricePerUnit * amount);
      return true;
    }
    return false;
  }
}

export const tradeSystem = new TradeSystem();