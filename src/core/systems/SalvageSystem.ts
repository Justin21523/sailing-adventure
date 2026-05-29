import { gameWorld } from '@/core/engine/GameWorld';
import { useGameStore } from '@/stores/gameStore';
import { notificationSystem } from './NotificationSystem';
import { audioManager } from '../audio/AudioManager';

export interface Wreckage {
  id: string;
  x: number;
  z: number;
  life: number;
}

export class SalvageSystem {
  public wreckage: Wreckage[] = [];
  private idCounter = 0;
  private salvageRadiusSq = 36; // 6 units

  public spawnWreckage(x: number, z: number): void {
    this.wreckage.push({
      id: `wreck_${this.idCounter++}`,
      x, z,
      life: 60.0 // Despawns after 60 seconds
    });
  }

  public update(delta: number): void {
    const shipPos = gameWorld.shipPhysics.position;

    for (let i = this.wreckage.length - 1; i >= 0; i--) {
      const w = this.wreckage[i];
      w.life -= delta;

      if (w.life <= 0) {
        this.wreckage.splice(i, 1);
        continue;
      }

      const dx = shipPos.x - w.x;
      const dz = shipPos.z - w.z;
      if (dx * dx + dz * dz < this.salvageRadiusSq) {
        // Auto-salvage
        const goldLoot = 30 + Math.floor(Math.random() * 20);
        const clothLoot = 5 + Math.floor(Math.random() * 5);
        
        useGameStore.getState().addResource('gold', goldLoot);
        useGameStore.getState().addResource('cloth', clothLoot);
        
        notificationSystem.push(`Salvaged ${goldLoot} Gold and ${clothLoot} Cloth!`, 'loot', 3);
        audioManager.playPickupSound();
        
        this.wreckage.splice(i, 1);
      }
    }
  }
}

export const salvageSystem = new SalvageSystem();