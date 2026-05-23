/**
 * PauseMenu.tsx
 * Full-screen overlay displayed when the game is paused.
 * Allows the user to adjust settings or quit the current run.
 */

import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameStore } from '@/stores/gameStore';

export function PauseMenu() {
  const isPaused = useUIStore((s) => s.isPaused);
  const resume = useUIStore((s) => s.resume);
  const resetGame = useGameStore((s) => s.resetGame);
  
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const postProcessing = useSettingsStore((s) => s.postProcessingEnabled);
  const togglePostProcessing = useSettingsStore((s) => s.togglePostProcessing);

  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
      <div className="glass-panel p-8 w-96 border-sand-light/30 shadow-2xl flex flex-col gap-6">
        <h2 className="text-4xl font-nautical text-sail-white text-center tracking-widest mb-4">PAUSED</h2>
        
        <button
          onClick={resume}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
        >
          RESUME
        </button>

        <div className="space-y-4 border-t border-sand-light/20 pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sand-light/80 text-sm flex justify-between">
              <span>Master Volume</span>
              <span>{Math.round(masterVolume * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sand-light/80 text-sm">Post-Processing</span>
            <button
              onClick={togglePostProcessing}
              className={`w-12 h-6 rounded-full transition-colors relative ${postProcessing ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${postProcessing ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            resetGame();
            window.location.reload(); // Hard reset to clear all singletons and WebGL context
          }}
          className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-bold tracking-wide mt-4"
        >
          QUIT TO MAIN MENU
        </button>
      </div>
    </div>
  );
}