/**
 * QuestLog.tsx
 * Displays active quests and tracks progress on the HUD.
 */

import { useQuestStore } from '@/stores/questStore';

export function QuestLog() {
  const activeQuests = useQuestStore((s) => s.activeQuests);
  const trackedQuests = activeQuests.filter(q => q.isTracked && !q.isCompleted).slice(0, 3);

  if (trackedQuests.length === 0) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '140px',
        right: '24px',
        zIndex: 20,
        pointerEvents: 'auto'
      }}
      className="glass-panel p-4 w-64 border-amber-500/20"
    >
      <h3 className="text-xs uppercase tracking-widest text-amber-400/80 mb-3 flex items-center gap-2">
        <span>📜</span> Active Quests
      </h3>
      
      <div className="space-y-3">
        {trackedQuests.map(quest => {
          const pct = (quest.currentProgress / quest.targetAmount) * 100;
          return (
            <div key={quest.id} className="border-b border-sand-light/10 pb-2 last:border-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-sail-white">{quest.title}</span>
                <span className="text-[10px] text-sand-light/60">{quest.currentProgress}/{quest.targetAmount}</span>
              </div>
              <div className="w-full bg-ocean-deep/60 rounded-full h-1.5">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}