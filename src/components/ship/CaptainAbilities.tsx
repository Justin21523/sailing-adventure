import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/stores/gameStore';
import { useShipStore } from '@/stores/shipStore';
import { notificationSystem } from '@/core/systems/NotificationSystem';
import { useUIStore } from '@/stores/uiStore';
import { crewManager } from '@/core/systems/CrewManager';

export function CaptainAbilities() {
  const repairCooldown = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (useUIStore.getState().isPaused || useUIStore.getState().isDocked) return;
      
      // Q: Emergency Repair (Costs 10 Wood, Heals 30 HP, 15s Cooldown)
      // Modifiers: Carpenter assigned crew increases heal amount
      if (e.code === 'KeyQ' && repairCooldown.current <= 0) {
        const store = useGameStore.getState();
        if (store.spendResource('wood', 10)) {
          const mods = crewManager.getModifiers();
          const healAmount = 30 + mods.repairRate; // repairRate is CARPENTER * 2.0
          useShipStore.getState().repair(healAmount);
          repairCooldown.current = 15.0;
          notificationSystem.push(`Emergency Repairs underway! (+${Math.round(healAmount)} HP)`, 'success', 2);
        } else {
          notificationSystem.push('Need 10 Wood for repairs!', 'warning', 2);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useFrame((_, delta) => {
    repairCooldown.current -= delta;
  });

  return null;
}