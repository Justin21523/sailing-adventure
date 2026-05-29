/**
 * HUD.tsx
 * All monitoring panels consolidated on the left side.
 * Includes: Vessel Status, Environment, Cargo Hold, Active Quests.
 * Circular navigation minimap is anchored bottom-left.
 */

import { useShipStore } from '@/stores/shipStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { useGameStore } from '@/stores/gameStore';
import { useUpgradeStore } from '@/stores/upgradeStore';
import { useQuestStore } from '@/stores/questStore';
import { Minimap } from './Minimap';
import type { IslandData } from '@/core/systems/ChunkManager';

interface HUDProps {
  islands: IslandData[];
}

export function HUD({ islands }: HUDProps) {
  const speed = useShipStore((s) => s.speedKnots);
  const heading = useShipStore((s) => s.headingDegrees);
  const hullHp = useShipStore((s) => s.hullHealth);
  const maxHp = useShipStore((s) => s.maxHullHealth);

  const windSpeed = useWeatherStore((s) => s.windSpeedKnots);
  const windDir = useWeatherStore((s) => s.windDirectionDegrees);

  const resources = useGameStore((s) => s.resources);
  const toggleShop = useUpgradeStore((s) => s.toggleShop);

  const activeQuests = useQuestStore((s) => s.activeQuests);
  const trackedQuests = activeQuests.filter(q => q.isTracked && !q.isCompleted).slice(0, 3);

  const hpPercentage = (hullHp / maxHp) * 100;
  const hpColor = hpPercentage > 50 ? 'bg-green-500' : hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500';

  // Convert heading degrees to cardinal direction label
  const cardinalDir = (deg: number) => {
    const d = ((deg % 360) + 360) % 360;
    if (d < 22.5 || d >= 337.5) return 'N';
    if (d < 67.5) return 'NE';
    if (d < 112.5) return 'E';
    if (d < 157.5) return 'SE';
    if (d < 202.5) return 'S';
    if (d < 247.5) return 'SW';
    if (d < 292.5) return 'W';
    return 'NW';
  };

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100, // Higher z-index to ensure it is above the canvas
      }}
      className="font-hud text-sail-white"
    >

      {/* Top Center: Shipwright Button */}
      <div 
        style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto'
        }}
        className="glass-panel px-4 py-2"
      >
        <button
          onClick={toggleShop}
          className="text-sm text-sand-light hover:text-yellow-200 transition-colors flex items-center gap-2"
        >
          <span>🛠️</span> Shipwright <span className="text-xs text-sand-light/50">(U)</span>
        </button>
      </div>

      {/* LEFT COLUMN: All monitoring panels */}
      <div 
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '256px',
          pointerEvents: 'auto'
        }}
      >

        {/* Panel 1: Vessel Status */}
        <div className="glass-panel p-4">
          <h2 className="text-xs uppercase tracking-widest text-sand-light/60 mb-3">⚓ Vessel Status</h2>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Hull Integrity</span>
              <span className="font-bold">{Math.round(hullHp)}/{maxHp}</span>
            </div>
            <div className="w-full bg-ocean-deep/50 rounded-full h-2.5">
              <div
                className={`${hpColor} h-2.5 rounded-full transition-all duration-300`}
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-ocean-deep/40 rounded p-2">
              <div className="text-sand-light/60 text-[10px] uppercase">Speed</div>
              <div className="text-lg font-bold text-blue-300">{speed.toFixed(1)} <span className="text-xs">kts</span></div>
            </div>
            <div className="bg-ocean-deep/40 rounded p-2">
              <div className="text-sand-light/60 text-[10px] uppercase">Heading</div>
              <div className="text-lg font-bold text-yellow-200">
                {Math.round(heading)}° <span className="text-xs text-yellow-300/80">{cardinalDir(heading)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Environment */}
        <div className="glass-panel p-4">
          <h2 className="text-xs uppercase tracking-widest text-sand-light/60 mb-3">🌊 Environment</h2>

          <div className="flex items-center gap-4">
            {/* Wind compass rose */}
            <div className="relative flex-shrink-0 w-14 h-14">
              {/* Outer ring */}
              <div className="absolute inset-0 border-2 border-sand-light/20 rounded-full" />
              {/* Cardinal ticks */}
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute w-0.5 h-2 bg-sand-light/30 left-1/2 -translate-x-1/2 top-0.5"
                  style={{ transform: `translateX(-50%) rotate(${deg}deg)`, transformOrigin: '50% 24px' }}
                />
              ))}
              {/* Wind direction arrow */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${windDir}deg)` }}
              >
                <div className="w-0.5 h-5 bg-cyan-400 rounded-full -translate-y-1" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
              {/* N label */}
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-[9px] text-yellow-200/70 font-bold">N</span>
            </div>

            <div className="flex-1">
              <div className="text-sand-light/60 text-[10px] uppercase">Wind Speed</div>
              <div className="text-xl font-bold text-cyan-300">{windSpeed.toFixed(1)} <span className="text-xs">kts</span></div>
              <div className="text-sand-light/50 text-[10px] mt-1">From {cardinalDir(windDir)}</div>
            </div>
          </div>
        </div>

        {/* Panel 3: Cargo Hold */}
        <div className="glass-panel p-4">
          <h2 className="text-xs uppercase tracking-widest text-sand-light/60 mb-3">📦 Cargo Hold</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-ocean-deep/40 rounded p-2 flex flex-col items-center gap-1">
              <span className="text-xl">🪵</span>
              <span className="text-sm font-bold text-amber-200">{resources.wood}</span>
              <span className="text-[9px] text-sand-light/50 uppercase">Wood</span>
            </div>
            <div className="bg-ocean-deep/40 rounded p-2 flex flex-col items-center gap-1">
              <span className="text-xl">🪙</span>
              <span className="text-sm font-bold text-yellow-400">{resources.gold}</span>
              <span className="text-[9px] text-sand-light/50 uppercase">Gold</span>
            </div>
            <div className="bg-ocean-deep/40 rounded p-2 flex flex-col items-center gap-1">
              <span className="text-xl">🧵</span>
              <span className="text-sm font-bold text-gray-200">{resources.cloth}</span>
              <span className="text-[9px] text-sand-light/50 uppercase">Cloth</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Active Quests (conditional) */}
        {trackedQuests.length > 0 && (
          <div className="glass-panel p-4 border-amber-500/20">
            <h3 className="text-xs uppercase tracking-widest text-amber-400/80 mb-3 flex items-center gap-2">
              <span>📜</span> Active Quests
            </h3>
            <div className="space-y-3">
              {trackedQuests.map(quest => {
                const pct = (quest.currentProgress / quest.targetAmount) * 100;
                return (
                  <div key={quest.id} className="border-b border-sand-light/10 pb-2 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-sail-white leading-tight">{quest.title}</span>
                      <span className="text-[10px] text-sand-light/60 ml-2 flex-shrink-0">
                        {quest.currentProgress}/{quest.targetAmount}
                      </span>
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
        )}

      </div>

      {/* Bottom Left: Circular Navigation (Minimap) */}
      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          pointerEvents: 'auto'
        }}
      >
        <div className="text-[10px] text-sand-light/50 uppercase tracking-widest text-center mb-1">Navigation</div>
        <Minimap islands={islands} />
      </div>

      {/* Bottom Center: Controls Hint */}
      <div 
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto'
        }}
        className="glass-panel px-6 py-2 text-xs text-sand-light/80 tracking-wide"
      >
        <span className="text-yellow-200">A/D</span> Rudder &nbsp;|&nbsp;
        <span className="text-yellow-200">W/S</span> Trim Sails &nbsp;|&nbsp;
        <span className="text-yellow-200">E</span> Dock &nbsp;|&nbsp;
        <span className="text-yellow-200">P</span> Pause
      </div>

    </div>
  );
}
