import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { questManager } from '@/core/systems/QuestManager';
import { audioManager } from '@/core/audio/AudioManager';
import { notificationSystem } from '@/core/systems/NotificationSystem';
import { treasureMapSystem } from '@/core/systems/TreasureMapSystem';

interface ActionConfig {
  id: string;
  icon: string;
  title: string;
  desc: string;
  cost?: { resource: 'wood' | 'gold' | 'cloth'; amount: number };
  reward?: { resource: 'wood' | 'gold' | 'cloth'; amount: number };
  isQuestAction?: boolean;
  cooldown: number; // seconds
}

export function ExplorationPanel() {
  const isDocked = useUIStore((s) => s.isDocked);
  const addResource = useGameStore((s) => s.addResource);
  const spendResource = useGameStore((s) => s.spendResource);
  const resources = useGameStore((s) => s.resources);
  
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isDocked) {
      setCooldowns({});
      return;
    }
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const key in next) {
          if (next[key] > 0) {
            next[key] = Math.max(0, next[key] - 0.1);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isDocked]);

  const handleAction = useCallback((action: ActionConfig) => {
    if (cooldowns[action.id] > 0) return;

    // 1. Check Cost
    if (action.cost) {
      if (resources[action.cost.resource] < action.cost.amount) {
        notificationSystem.push(`Not enough ${action.cost.resource}!`, 'warning', 2);
        return;
      }
      spendResource(action.cost.resource, action.cost.amount);
    }

    // 2. Execute Logic
    if (action.id === 'map') {
      const rarity = Math.random() > 0.8 ? 'RARE' : (Math.random() > 0.9 ? 'EPIC' : 'COMMON');
      treasureMapSystem.addMap(rarity);
    } else if (action.isQuestAction) {
      questManager.pushEvent('EXPLORE', 1);
      if (action.reward) addResource(action.reward.resource, action.reward.amount);
    } else {
      if (action.reward) addResource(action.reward.resource, action.reward.amount);
    }

    // 3. Feedback
    audioManager.playPickupSound();
    if (action.id !== 'map') {
      notificationSystem.push(
        action.isQuestAction ? 'Area Charted!' : `Crew returned with ${action.reward?.amount} ${action.reward?.resource}!`, 
        'loot', 
        2.0
      );
    }

    // 4. Set Cooldown
    setCooldowns((prev) => ({ ...prev, [action.id]: action.cooldown }));
  }, [cooldowns, resources, addResource, spendResource]);

  if (!isDocked) return null;

  const actions: ActionConfig[] = [
    { id: 'lumber', icon: '🌲', title: 'Chop Wood', desc: 'Send crew to forest.', reward: { resource: 'wood', amount: 15 }, cooldown: 3 },
    { id: 'mine', icon: '⛏️', title: 'Mine Ruins', desc: 'Scavenge stones.', reward: { resource: 'gold', amount: 20 }, cooldown: 4 },
    { id: 'scavenge', icon: '🧵', title: 'Search Wrecks', desc: 'Find sails.', reward: { resource: 'cloth', amount: 8 }, cooldown: 3 },
    { id: 'explore', icon: '🗺️', title: 'Map Island', desc: 'Chart area (Quest).', reward: { resource: 'gold', amount: 5 }, isQuestAction: true, cooldown: 10 },
    { id: 'map', icon: '📜', title: 'Seek Rumors', desc: 'Buy Treasure Map.', cost: { resource: 'gold', amount: 20 }, cooldown: 5 },
  ];

  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        pointerEvents: 'auto'
      }}
      className="glass-panel p-6 w-[650px] max-w-[95vw] border-amber-500/30 shadow-2xl"
    >
      <h2 className="text-2xl font-nautical text-amber-300 text-center tracking-widest mb-4">ISLAND EXPLORATION</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map((act) => {
          const cd = cooldowns[act.id] || 0;
          const isOnCooldown = cd > 0;
          const cdPct = (cd / act.cooldown) * 100;
          const canAfford = !act.cost || resources[act.cost.resource] >= act.cost.amount;

          return (
            <button
              key={act.id}
              onClick={() => handleAction(act)}
              disabled={isOnCooldown || !canAfford}
              className={`relative bg-ocean-deep/80 hover:bg-ocean-shallow border border-sand-light/20 hover:border-amber-400/50 rounded-lg p-3 flex flex-col items-center gap-2 transition-all active:scale-95 overflow-hidden ${
                (isOnCooldown || !canAfford) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {/* Cooldown Progress Bar */}
              {isOnCooldown && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-100 ease-linear"
                    style={{ width: `${cdPct}%` }}
                  />
                </div>
              )}

              <div className="relative z-10 flex flex-col items-center gap-2">
                <span className="text-3xl">{act.icon}</span>
                <span className="text-sm font-bold text-sail-white">{act.title}</span>
                <span className="text-[10px] text-sand-light/60 text-center h-6">{act.desc}</span>
                
                <div className="text-xs font-bold mt-1">
                  {act.cost && (
                    <span className={canAfford ? 'text-red-300' : 'text-red-500'}>
                      -{act.cost.amount} {act.cost.resource}
                    </span>
                  )}
                  {act.reward && (
                    <span className="text-amber-200">+{act.reward.amount} {act.reward.resource}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-center text-xs text-sand-light/50 mt-4">Press <span className="text-amber-300 font-bold">E</span> or <span className="text-amber-300 font-bold">ESC</span> to Undock</p>
    </div>
  );
}