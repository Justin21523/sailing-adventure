/**
 * GameOverScreen.tsx
 * Full-screen overlay displayed when the ship's hull health reaches zero.
 * Provides a clean restart mechanism that resets all singletons and WebGL state.
 */

import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { gameWorld } from '@/core/engine/GameWorld';

export function GameOverScreen() {
  const show = useUIStore((s) => s.showGameOver);
  const resetUI = useUIStore((s) => s.resetUI);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!show) return null;

  const handleRestart = () => {
    gameWorld.reset();
    resetGame();
    resetUI();
    // Hard reload ensures all pure TS singletons, audio contexts, and WebGL buffers are cleanly wiped
    window.location.reload(); 
  };

  return (
    <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
      <div className="glass-panel p-10 w-96 border-red-500/50 shadow-2xl flex flex-col gap-6 items-center bg-black/60">
        <h2 className="text-5xl font-nautical text-red-400 text-center tracking-widest mb-2">SUNK</h2>
        <p className="text-sand-light/80 text-center">Your vessel has been claimed by the deep. The ocean is unforgiving.</p>
        
        <button
          onClick={handleRestart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 mt-4"
        >
          SET SAIL AGAIN
        </button>
      </div>
    </div>
  );
}