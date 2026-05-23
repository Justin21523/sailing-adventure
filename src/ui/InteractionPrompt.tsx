/**
 * InteractionPrompt.tsx
 * Displays contextual UI prompts for interacting with the environment (e.g., Docking).
 */

import { useUIStore } from '@/stores/uiStore';

export function InteractionPrompt() {
  const prompt = useUIStore((s) => s.activePrompt);
  const isDocked = useUIStore((s) => s.isDocked);

  if (prompt === 'NONE' && !isDocked) return null;

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      {isDocked ? (
        <div className="glass-panel px-6 py-3 border-green-400/50 bg-green-900/60 animate-pulse">
          <p className="text-green-100 font-bold tracking-wide flex items-center gap-2">
            <span>⚓</span> DOCKED - REPAIRING... <span className="text-xs text-green-300">(Press E to Undock)</span>
          </p>
        </div>
      ) : (
        <div className="glass-panel px-6 py-3 border-amber-400/50 bg-amber-900/60">
          <p className="text-amber-100 font-bold tracking-wide flex items-center gap-2">
            Press <span className="bg-white/20 px-2 py-0.5 rounded text-white">E</span> to Dock & Repair
          </p>
        </div>
      )}
    </div>
  );
}