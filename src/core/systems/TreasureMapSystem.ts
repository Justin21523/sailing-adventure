/**
 * TreasureMapSystem.ts
 * Manages the acquisition, tracking, and digging of treasure maps.
 * Generates target coordinates in the infinite ocean and rewards the player upon arrival.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useGameStore } from '@/stores/gameStore';
import { notificationSystem } from './NotificationSystem';
import { audioManager } from '../audio/AudioManager';

export interface TreasureMap {
  id: string;
  targetX: number;
  targetZ: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC';
  isTracked: boolean;
}

export class TreasureMapSystem {
  public maps: TreasureMap[] = [];
  private idCounter = 0;
  private digRadiusSq = 36; // 6 units radius to trigger dig

  public addMap(rarity: 'COMMON' | 'RARE' | 'EPIC' = 'COMMON'): void {
    const shipPos = gameWorld.shipPhysics.position;
    // Generate target somewhere far away (200 to 600 units)
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 400;
    
    this.maps.push({
      id: `map_${this.idCounter++}`,
      targetX: shipPos.x + Math.cos(angle) * dist,
      targetZ: shipPos.z + Math.sin(angle) * dist,
      rarity,
      isTracked: this.maps.length === 0 // Auto-track first map
    });
    notificationSystem.push(`Acquired a ${rarity} Treasure Map!`, 'loot', 3);
  }

  public trackMap(id: string): void {
    this.maps.forEach(m => m.isTracked = (m.id === id));
  }

  public getTrackedMap(): TreasureMap | undefined {
    return this.maps.find(m => m.isTracked);
  }

  public update(_delta: number): void {
    const shipPos = gameWorld.shipPhysics.position;
    const tracked = this.getTrackedMap();
    
    if (tracked) {
      const dx = shipPos.x - tracked.targetX;
      const dz = shipPos.z - tracked.targetZ;
      if (dx * dx + dz * dz < this.digRadiusSq) {
        this.digTreasure(tracked);
      }
    }
  }

  private digTreasure(map: TreasureMap): void {
    const store = useGameStore.getState();
    let gold = 50, wood = 20, cloth = 10;

    if (map.rarity === 'RARE') {
      gold = 150; wood = 50; cloth = 30;
    } else if (map.rarity === 'EPIC') {
      gold = 500; wood = 100; cloth = 80;
    }

    store.addResource('gold', gold);
    store.addResource('wood', wood);
    store.addResource('cloth', cloth);

    notificationSystem.push(`Treasure Unearthed! +${gold} Gold`, 'success', 4);
    audioManager.playPickupSound();

    // Remove map
    this.maps = this.maps.filter(m => m.id !== map.id);
  }
}

export const treasureMapSystem = new TreasureMapSystem();