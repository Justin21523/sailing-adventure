/**
 * IslandObjectiveUI.tsx
 * Displays contextual objectives when approaching special island landmarks.
 */

import { useUIStore } from '@/stores/uiStore';
import { useQuestStore } from '@/stores/questStore';

export function IslandObjectiveUI() {
  const prompt = useUIStore((s) => s.activePrompt);
  const targetId = useUIStore((s) => s.targetIslandId);
  const activeQuests = useQuestStore((s) => s.activeQuests);

  if (prompt !== 'DOCK' || !targetId) return null;

  // Find the specific quest for this island
  const islandQuest = activeQuests.find(q => q.id.includes(targetId));

  return (
    <div 
      style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        pointerEvents: 'none'
      }}
      className="glass-panel px-8 py-4 border-cyan-400/50 bg-cyan-900/40 animate-pulse text-center"
    >
      <h3 className="text-xl font-nautical text-cyan-200 tracking-widest mb-2">
        {islandQuest ? islandQuest.title : 'LANDMARK DISCOVERED'}
      </h3>
      {islandQuest && (
        <p className="text-sm text-sand-light/80 mb-3">{islandQuest.description}</p>
      )}
      <p className="text-amber-300 font-bold text-sm tracking-wide">
        SLOW DOWN & PRESS <span className="bg-white/20 px-2 py-0.5 rounded text-white">E</span> TO INTERACT
      </p>
    </div>
  );
}