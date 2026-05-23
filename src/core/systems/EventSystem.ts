/**
 * EventSystem.ts
 * Manages the spawning, tracking, and despawning of dynamic world events,
 * specifically floating loot crates. It ensures the world feels alive 
 * by continuously providing points of interest around the player.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import type { Vector3Tuple } from '@/types';

export type LootType = 'WOOD' | 'GOLD' | 'CLOTH';

export interface LootEntity {
  id: string;
  position: Vector3Tuple;
  type: LootType;
  spawnTime: number;
}

export class EventSystem {
  public activeLoot: LootEntity[] = [];
  private lootIdCounter = 0;
  private lastSpawnTime = 0;
  
  private readonly spawnInterval = 8; // Seconds between spawn attempts
  private readonly maxLoot = 6;     // Maximum simultaneous crates
  private readonly despawnDistance = 150; // Remove crates if player sails too far away

  /**
   * Steps the event system forward. Called every frame from the R3F loop.
   */
  public update(time: number): void {
    const shipPos = gameWorld.shipPhysics.position;

    // 1. Despawn distant loot to keep memory and draw calls low
    this.activeLoot = this.activeLoot.filter((loot) => {
      const dx = loot.position[0] - shipPos.x;
      const dz = loot.position[2] - shipPos.z;
      const distSq = dx * dx + dz * dz;
      return distSq < this.despawnDistance * this.despawnDistance;
    });

    // 2. Spawn new loot if conditions are met
    if (time - this.lastSpawnTime > this.spawnInterval && this.activeLoot.length < this.maxLoot) {
      this.spawnLoot(shipPos.x, shipPos.z, time);
      this.lastSpawnTime = time;
    }
  }

  private spawnLoot(shipX: number, shipZ: number, time: number): void {
    // Spawn in a ring around the player (40 to 100 units away)
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60; 
    
    const x = shipX + Math.cos(angle) * distance;
    const z = shipZ + Math.sin(angle) * distance;

    const types: LootType[] = ['WOOD', 'GOLD', 'CLOTH'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.activeLoot.push({
      id: `loot_${this.lootIdCounter++}`,
      position: [x, 0, z],
      type,
      spawnTime: time,
    });
  }

  /**
   * Removes a specific loot entity (triggered upon player collision/pickup).
   */
  public removeLoot(id: string): void {
    this.activeLoot = this.activeLoot.filter((l) => l.id !== id);
  }
}

// Singleton instance shared across the app
export const eventSystem = new EventSystem();