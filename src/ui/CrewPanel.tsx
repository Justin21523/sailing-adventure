/**
 * CrewPanel.tsx
 * UI for managing and assigning crew members while docked.
 */

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { crewManager, type CrewRole } from '@/core/systems/CrewManager';
import { notificationSystem } from '@/core/systems/NotificationSystem';

export function CrewPanel() {
  const isDocked = useUIStore((s) => s.isDocked);
  const [state, setState] = useState(crewManager.state);

  useEffect(() => {
    if (isDocked) {
      const interval = setInterval(() => setState({ ...crewManager.state }), 100);
      return () => clearInterval(interval);
    }
  }, [isDocked]);

  if (!isDocked) return null;

  const handleAssign = (role: CrewRole, amount: number) => {
    crewManager.assign(role, amount);
    setState({ ...crewManager.state });
  };

  const handleHire = () => {
    if (crewManager.hire(1, 50)) {
      notificationSystem.push('Hired a new crew member!', 'success', 2);
      setState({ ...crewManager.state });
    } else {
      notificationSystem.push('Not enough Gold! (50g)', 'warning', 2);
    }
  };

  const roles: { role: CrewRole, icon: string, title: string, desc: string }[] = [
    { role: 'GUNNER', icon: '💣', title: 'Gunners', desc: 'Reduces cannon cooldown.' },
    { role: 'SAILOR', icon: '⛵', title: 'Sailors', desc: 'Increases top speed.' },
    { role: 'CARPENTER', icon: '🔨', title: 'Carpenters', desc: 'Repairs ship while docked.' },
  ];

  return (
    <div style={{ position: 'absolute', top: '15%', left: '24px', zIndex: 30, pointerEvents: 'auto' }} className="glass-panel p-4 w-64 border-cyan-500/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-nautical text-cyan-300">Crew Quarters</h3>
        <button onClick={handleHire} className="text-xs bg-amber-600 hover:bg-amber-500 px-2 py-1 rounded text-white">
          Hire (50g)
        </button>
      </div>
      
      <div className="text-xs text-sand-light/60 mb-3">
        Total: {state.total} | Idle: <span className="text-amber-300 font-bold">{crewManager.getUnassigned()}</span>
      </div>

      <div className="space-y-3">
        {roles.map(r => (
          <div key={r.role} className="bg-ocean-deep/60 p-2 rounded border border-sand-light/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{r.icon}</span>
              <div>
                <div className="text-sm font-bold text-sail-white">{r.title}</div>
                <div className="text-[10px] text-sand-light/60">{r.desc}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button onClick={() => handleAssign(r.role, -1)} className="w-6 h-6 bg-red-800 hover:bg-red-700 rounded text-white font-bold">-</button>
              <span className="text-lg font-bold text-amber-200">{state.assigned[r.role]}</span>
              <button onClick={() => handleAssign(r.role, 1)} className="w-6 h-6 bg-green-800 hover:bg-green-700 rounded text-white font-bold">+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}