/**
 * TradePanel.tsx
 * UI overlay for trading resources when docked at an island.
 * Prices fluctuate based on the island's specific Biome.
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { tradeSystem, type TradeGood } from '@/core/systems/TradeSystem';
import { chunkManager } from '@/core/systems/ChunkManager';
import { gameWorld } from '@/core/engine/GameWorld';
import { notificationSystem } from '@/core/systems/NotificationSystem';

export function TradePanel() {
  const isDocked = useUIStore((s) => s.isDocked);
  const targetIslandId = useUIStore((s) => s.targetIslandId);
  const resources = useGameStore((s) => s.resources);
  
  const [goods, setGoods] = useState<TradeGood[]>([]);

  useEffect(() => {
    if (isDocked && targetIslandId) {
      const shipPos = gameWorld.shipPhysics.position;
      const islands = chunkManager.update(shipPos.x, shipPos.z);
      const island = islands.find(i => i.id === targetIslandId);
      if (island) {
        setGoods(tradeSystem.getMarketPrices(island.biome));
      }
    }
  }, [isDocked, targetIslandId]);

  if (!isDocked || goods.length === 0) return null;

  const handleBuy = (good: TradeGood) => {
    if (tradeSystem.buy(good.resource, 5, good.buyPrice)) {
      notificationSystem.push(`Bought 5 ${good.resource}`, 'success', 2);
    } else {
      notificationSystem.push('Not enough Gold!', 'warning', 2);
    }
  };

  const handleSell = (good: TradeGood) => {
    if (tradeSystem.sell(good.resource, 5, good.sellPrice)) {
      notificationSystem.push(`Sold 5 ${good.resource}`, 'success', 2);
    } else {
      notificationSystem.push(`Not enough ${good.resource}!`, 'warning', 2);
    }
  };

  return (
    <div style={{ position: 'absolute', top: '15%', right: '24px', zIndex: 30, pointerEvents: 'auto' }} className="glass-panel p-4 w-72 border-amber-500/30">
      <h3 className="text-lg font-nautical text-amber-300 mb-3 text-center">Island Market</h3>
      <div className="text-xs text-sand-light/60 mb-2 text-center">Hold: 🪙 {resources.gold}</div>
      <div className="space-y-2">
        {goods.map(g => (
          <div key={g.resource} className="bg-ocean-deep/60 p-2 rounded flex items-center justify-between text-xs">
            <span className="capitalize font-bold text-sail-white w-16">{g.resource}</span>
            <div className="flex gap-2">
              <button onClick={() => handleBuy(g)} className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white">
                Buy 5 ({g.buyPrice}g)
              </button>
              <button onClick={() => handleSell(g)} className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-white">
                Sell 5 ({g.sellPrice}g)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}