/**
 * UpgradeShop.tsx
 * Modal UI for the Shipwright. Allows players to spend collected resources 
 * to permanently upgrade ship statistics.
 */

import { useUpgradeStore } from '@/stores/upgradeStore';
import { useGameStore } from '@/stores/gameStore';
import { UpgradeSystem, UPGRADE_COSTS } from '@/core/systems/UpgradeSystem';
import { type UpgradeType } from '@/stores/upgradeStore';
import { ShipyardVisualsPanel } from './ShipyardVisualsPanel';

export function UpgradeShop() {
  const isOpen = useUpgradeStore((s) => s.isShopOpen);
  const closeShop = useUpgradeStore((s) => s.closeShop);
  const levels = useUpgradeStore((s) => s.levels);
  const resources = useGameStore((s) => s.resources);

  if (!isOpen) return null;

  const handleUpgrade = (type: UpgradeType) => {
    UpgradeSystem.attemptUpgrade(type);
  };

  const canAfford = (type: UpgradeType) => {
    const cost = UPGRADE_COSTS[type];
    return resources.wood >= cost.wood && resources.gold >= cost.gold && resources.cloth >= cost.cloth;
  };

  const items: { type: UpgradeType, title: string, icon: string, desc: string }[] = [
    { type: 'hull', title: 'Reinforce Hull', icon: '🛡️', desc: 'Increases max HP and fully repairs the ship.' },
    { type: 'sails', title: 'Upgrade Sails', icon: '💨', desc: 'Increases top speed and acceleration.' },
    { type: 'rudder', title: 'Enhance Rudder', icon: '⚓', desc: 'Improves turning radius and responsiveness.' },
  ];

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
      <div className="glass-panel p-8 w-[600px] max-w-[90vw] border-sand-light/30 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-nautical text-sail-white tracking-wide">Shipwright</h2>
          <button 
            onClick={closeShop}
            className="text-sand-light/60 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {items.map((item) => {
            const cost = UPGRADE_COSTS[item.type];
            const level = levels[item.type];
            const affordable = canAfford(item.type);

            return (
              <div key={item.type} className="bg-ocean-deep/60 p-4 rounded-lg border border-sand-light/10 flex flex-col">
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="text-lg font-bold text-sail-white mb-1">{item.title}</h3>
                <p className="text-xs text-sand-light/60 mb-3 flex-grow">{item.desc}</p>
                
                <div className="text-xs text-sand-light/80 mb-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="font-bold text-yellow-300">{level}</span>
                  </div>
                  <div className="border-t border-sand-light/10 my-2"></div>
                  <div className="flex justify-between">
                    <span>🪵 Wood:</span>
                    <span className={resources.wood >= cost.wood ? 'text-green-400' : 'text-red-400'}>{cost.wood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🪙 Gold:</span>
                    <span className={resources.gold >= cost.gold ? 'text-green-400' : 'text-red-400'}>{cost.gold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🧵 Cloth:</span>
                    <span className={resources.cloth >= cost.cloth ? 'text-green-400' : 'text-red-400'}>{cost.cloth}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleUpgrade(item.type)}
                  disabled={!affordable}
                  className={`w-full py-2 rounded font-bold text-sm transition-all ${
                    affordable 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {affordable ? 'UPGRADE' : 'INSUFFICIENT'}
                </button>
              </div>
            );
          })}
        </div>
        <ShipyardVisualsPanel />
        <p className="text-center text-xs text-sand-light/40">Press <span className="text-yellow-200 font-bold">U</span> or <span className="text-yellow-200 font-bold">ESC</span> to close</p>
      </div>
    </div>
  );
}