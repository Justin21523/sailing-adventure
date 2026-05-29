/**
 * FishingMinigameUI.tsx
 * HUD overlay for the fishing minigame. Displays state and QTE progress bar.
 */

import { useState, useEffect, useRef } from 'react';
import { fishingSystem } from '@/core/systems/FishingSystem';

export function FishingMinigameUI() {
  const [state, setState] = useState(fishingSystem.state);
  const [biteTimer, setBiteTimer] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      setState(fishingSystem.state);
      setBiteTimer(fishingSystem.biteWindow);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (state === 'IDLE') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
      {state === 'WAITING' && (
        <div className="glass-panel px-6 py-3 text-sand-light/80 text-sm tracking-widest animate-pulse">
          FISHING... (Press SPACE to reel)
        </div>
      )}
      
      {state === 'BITE' && (
        <div className="flex flex-col items-center gap-4 animate-bounce">
          <div className="text-4xl font-bold text-red-500 tracking-widest drop-shadow-lg">
            BITE!
          </div>
          <div className="w-48 h-4 bg-black/60 rounded-full overflow-hidden border-2 border-white/50">
            <div 
              className="h-full bg-red-500 transition-all duration-100 ease-linear"
              style={{ width: `${(biteTimer / 2.0) * 100}%` }}
            />
          </div>
          <div className="text-xl font-bold text-white tracking-widest">
            PRESS SPACE!
          </div>
        </div>
      )}
      
      {state === 'CASTING' && (
        <div className="glass-panel px-6 py-3 text-sand-light/80 text-sm tracking-widest">
          CASTING...
        </div>
      )}
    </div>
  );
}