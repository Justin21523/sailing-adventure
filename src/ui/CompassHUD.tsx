/**
 * CompassHUD.tsx
 * A dynamic compass that points towards the currently tracked Treasure Map.
 * Uses requestAnimationFrame to update the DOM directly without React re-renders.
 */

import { useEffect, useRef, useState } from 'react';
import { gameWorld } from '@/core/engine/GameWorld';
import { treasureMapSystem } from '@/core/systems/TreasureMapSystem';

export function CompassHUD() {
  const needleRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [rarity, setRarity] = useState<string>('');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateCompass = () => {
      const tracked = treasureMapSystem.getTrackedMap();
      if (tracked && needleRef.current) {
        const shipPos = gameWorld.shipPhysics.position;
        const shipHeading = gameWorld.shipPhysics.heading;

        const dx = tracked.targetX - shipPos.x;
        const dz = tracked.targetZ - shipPos.z;
        
        const targetAngle = Math.atan2(dx, dz);
        let relativeAngle = targetAngle - shipHeading;
        
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
        
        const deg = relativeAngle * (180 / Math.PI);
        needleRef.current.style.transform = `rotate(${deg}deg)`;
        
        const dist = Math.sqrt(dx * dx + dz * dz);
        setDistance(Math.round(dist));
        setRarity(tracked.rarity);
      } else {
        setDistance(null);
      }
      rafRef.current = requestAnimationFrame(updateCompass);
    };

    rafRef.current = requestAnimationFrame(updateCompass);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (distance === null) return null;

  const rarityColor = rarity === 'EPIC' ? 'text-purple-400 border-purple-500' : 
                      rarity === 'RARE' ? 'text-blue-400 border-blue-500' : 
                      'text-amber-400 border-amber-500';

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
      <div className={`glass-panel w-24 h-24 rounded-full flex items-center justify-center border-2 ${rarityColor} relative`}>
        <div className="absolute top-2 text-[10px] font-bold tracking-widest text-sand-light/60">N</div>
        <div className="absolute bottom-2 text-[10px] font-bold tracking-widest text-sand-light/60">S</div>
        <div className="absolute left-2 text-[10px] font-bold tracking-widest text-sand-light/60">W</div>
        <div className="absolute right-2 text-[10px] font-bold tracking-widest text-sand-light/60">E</div>
        
        <div ref={needleRef} className="w-1 h-10 bg-red-500 absolute top-3 origin-bottom rounded-full shadow-lg transition-transform duration-100" />
        <div className="w-3 h-3 bg-amber-300 rounded-full absolute z-10 border border-white/50" />
      </div>
      <div className="text-center mt-2 text-sm font-bold text-sail-white tracking-wider bg-black/40 px-3 py-1 rounded-full">
        {distance}m
      </div>
    </div>
  );
}