/**
 * ExplorationPanel.tsx
 * UI overlay displayed when the ship is docked at an island.
 * Allows the player to dispatch crew to gather specific resources.
 */

import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { questManager } from '@/core/systems/QuestManager';
import { audioManager } from '@/core/audio/AudioManager';
import { notificationSystem } from '@/core/systems/NotificationSystem';

export function ExplorationPanel() {
  const isDocked = useUIStore((s) => s.isDocked);
  const addResource = useGameStore((s) => s.addResource);

  if (!isDocked) return null;

  const handleAction = (action: string, resource: 'wood' | 'gold' | 'cloth', amount: number) => {
    addResource(resource, amount);
    audioManager.playPickupSound();
    notificationSystem.push(`Crew returned with ${amount} ${resource}!`, 'loot', 2.0);
    
    if (action === 'explore') {
      questManager.pushEvent('EXPLORE', 1);
    }
  };

  const actions = [
    { id: 'lumber', icon: '🌲', title: 'Chop Wood', desc: 'Send crew to the forest.', res: 'wood' as const, amt: 15 },
    { id: 'mine', icon: '⛏️', title: 'Mine Ruins', desc: 'Scavenge ancient stones.', res: 'gold' as const, amt: 20 },
    { id: 'scavenge', icon: '🧵', title: 'Search Wrecks', desc: 'Find sails on the beach.', res: 'cloth' as const, amt: 8 },
    { id: 'explore', icon: '🗺️', title: 'Map Island', desc: 'Chart the area (Quest Progress).', res: 'gold' as const, amt: 5 },
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
      className="glass-panel p-6 w-[600px] max-w-[90vw] border-amber-500/30 shadow-2xl"
    >
      <h2 className="text-2xl font-nautical text-amber-300 text-center tracking-widest mb-4">ISLAND EXPLORATION</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => handleAction(act.id, act.res, act.amt)}
            className="bg-ocean-deep/80 hover:bg-ocean-shallow border border-sand-light/20 hover:border-amber-400/50 rounded-lg p-3 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <span className="text-3xl">{act.icon}</span>
            <span className="text-sm font-bold text-sail-white">{act.title}</span>
            <span className="text-[10px] text-sand-light/60 text-center">{act.desc}</span>
            <span className="text-xs text-amber-200 font-bold">+{act.amt} {act.res.toUpperCase()}</span>
          </button>
        ))}
      </div>
      
      <p className="text-center text-xs text-sand-light/50 mt-4">Press <span className="text-amber-300 font-bold">E</span> or <span className="text-amber-300 font-bold">ESC</span> to Undock</p>
    </div>
  );
}