/**
 * MerchantTradePanel.tsx
 * Floating market shown on the LEFT while sailing close to a sea merchant.
 * Mirrors the island TradePanel but uses the merchant's own price sheet.
 * Rendered OUTSIDE the R3F Canvas (it is plain HTML).
 */

import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { tradeSystem } from '@/core/systems/TradeSystem';
import { notificationSystem } from '@/core/systems/NotificationSystem';

export function MerchantTradePanel() {
  const activeMerchantId = useUIStore((s) => s.activeMerchantId);
  const isDocked = useUIStore((s) => s.isDocked);
  const resources = useGameStore((s) => s.resources);

  if (isDocked || !activeMerchantId) return null;

  const goods = tradeSystem.getMerchantPrices();

  const handleBuy = (resource: typeof goods[number]['resource'], price: number) => {
    if (tradeSystem.buy(resource, 5, price)) {
      notificationSystem.push(`Bought 5 ${resource}`, 'success', 2);
    } else {
      notificationSystem.push('Not enough Gold!', 'warning', 2);
    }
  };

  const handleSell = (resource: typeof goods[number]['resource'], price: number) => {
    if (tradeSystem.sell(resource, 5, price)) {
      notificationSystem.push(`Sold 5 ${resource}`, 'success', 2);
    } else {
      notificationSystem.push(`Not enough ${resource}!`, 'warning', 2);
    }
  };

  return (
    <div
      style={{ position: 'absolute', top: '15%', left: '24px', zIndex: 30, pointerEvents: 'auto' }}
      className="glass-panel p-4 w-72 border-cyan-500/30"
    >
      <h3 className="text-lg font-nautical text-cyan-200 mb-1 text-center">⛵ Merchant Trader</h3>
      <div className="text-xs text-sand-light/60 mb-3 text-center">
        Hold: 🪙 {resources.gold} · sail away to leave
      </div>
      <div className="space-y-2">
        {goods.map((g) => (
          <div key={g.resource} className="bg-ocean-deep/60 p-2 rounded flex items-center justify-between text-xs">
            <span className="capitalize font-bold text-sail-white w-16">{g.resource}</span>
            <div className="flex gap-2">
              <button onClick={() => handleBuy(g.resource, g.buyPrice)} className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white">
                Buy 5 ({g.buyPrice}g)
              </button>
              <button onClick={() => handleSell(g.resource, g.sellPrice)} className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-white">
                Sell 5 ({g.sellPrice}g)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
