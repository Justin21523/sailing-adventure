/**
 * MobileControls.tsx
 * Touch-optimized virtual controls for mobile browsers.
 * Renders a steering slider on the left and sail trim buttons on the right.
 * Only mounts if a touch interface is detected to keep desktop UI clean.
 */

import { useEffect, useRef, useState } from 'react';
import { inputManager } from '@/core/engine/InputManager';

export function MobileControls() {
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    // Detect touch capability
    const checkTouch = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current || !isDragging.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxOffset = rect.width / 2;
    
    // Calculate normalized value (-1 to 1)
    let offset = (clientX - centerX) / maxOffset;
    offset = Math.max(-1, Math.min(1, offset));
    
    inputManager.setVirtualRudder(offset);
  };

  const handleTouchStart = () => { isDragging.current = true; };
  const handleTouchEnd = () => { 
    isDragging.current = false; 
    inputManager.setVirtualRudder(0); // Snap back to center
  };

  if (!isMobile) return null;

  return (
    <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none z-30 md:hidden">
      
      {/* Left: Rudder Slider */}
      <div className="absolute bottom-8 left-8 pointer-events-auto">
        <div 
          ref={sliderRef}
          className="w-48 h-16 bg-ocean-deep/60 backdrop-blur-sm rounded-full border-2 border-sand-light/30 flex items-center justify-center relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
        >
          <div className="w-2 h-12 bg-sand-light/20 rounded-full absolute" />
          <div className="w-16 h-16 bg-amber-500/80 rounded-full shadow-lg border-2 border-white/50 flex items-center justify-center text-2xl text-white">
            ⚓
          </div>
        </div>
        <p className="text-center text-sand-light/60 text-xs mt-2 tracking-widest">RUDDER</p>
      </div>

      {/* Right: Sail Controls */}
      <div className="absolute bottom-8 right-8 pointer-events-auto flex flex-col gap-4">
        <button
          className="w-20 h-20 bg-cyan-600/80 backdrop-blur-sm rounded-full border-2 border-white/30 text-white text-3xl active:scale-95 transition-transform shadow-lg"
          onTouchStart={() => inputManager.setVirtualSailTrim(-1)}
          onTouchEnd={() => inputManager.setVirtualSailTrim(0)}
        >
          ⬆️
        </button>
        <button
          className="w-20 h-20 bg-orange-600/80 backdrop-blur-sm rounded-full border-2 border-white/30 text-white text-3xl active:scale-95 transition-transform shadow-lg"
          onTouchStart={() => inputManager.setVirtualSailTrim(1)}
          onTouchEnd={() => inputManager.setVirtualSailTrim(0)}
        >
          ⬇️
        </button>
        <p className="text-center text-sand-light/60 text-xs tracking-widest">SAILS</p>
      </div>
    </div>
  );
}