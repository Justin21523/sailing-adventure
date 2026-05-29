import { useShipStore } from '@/stores/shipStore';

export function CombatHUD() {
  const cannonCooldown = useShipStore((s) => s.cannonCooldown);
  const maxCannonCooldown = useShipStore((s) => s.maxCannonCooldown);
  
  const cooldownPct = (cannonCooldown / maxCannonCooldown) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
      <div className="relative w-16 h-16 opacity-60">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-white" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-red-500" />
      </div>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-48 h-2 bg-black/50 rounded-full overflow-hidden border border-white/20">
        <div 
          className="h-full bg-amber-500"
          style={{ 
            width: `${100 - cooldownPct}%`,
            transition: cannonCooldown > 0 ? 'none' : 'width 0.2s ease-out'
          }}
        />
      </div>
      <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs text-sand-light/60 tracking-widest">
        CANNONS (LMB / F)
      </p>
    </div>
  );
}