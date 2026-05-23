/**
 * ChunkManager.ts
 * Infinite procedural world generation using a Chunk-based system.
 * Dynamically loads and unloads islands based on the player's current position.
 * Uses seeded pseudo-random numbers to ensure the world is consistent (deterministic).
 */

import type { IslandData } from './WorldGeneration';

// Simple seeded PRNG (Mulberry32) for deterministic chunk generation
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export class ChunkManager {
  private activeChunks: Map<string, IslandData[]> = new Map();
  private chunkSize: number = 250; // World units per chunk
  private viewDistance: number = 2; // Load chunks in a 5x5 grid around player
  private globalSeed: number;

  constructor(globalSeed: number = 12345) {
    this.globalSeed = globalSeed;
  }

  /**
   * Updates the active chunks based on player position.
   * Returns a flattened array of all currently visible islands.
   */
  public update(playerX: number, playerZ: number): IslandData[] {
    const centerCX = Math.floor(playerX / this.chunkSize);
    const centerCZ = Math.floor(playerZ / this.chunkSize);
    
    const neededChunkKeys = new Set<string>();
    const allActiveIslands: IslandData[] = [];

    // 1. Determine which chunks should be loaded
    for (let x = centerCX - this.viewDistance; x <= centerCX + this.viewDistance; x++) {
      for (let z = centerCZ - this.viewDistance; z <= centerCZ + this.viewDistance; z++) {
        const key = `${x},${z}`;
        neededChunkKeys.add(key);

        if (!this.activeChunks.has(key)) {
          this.generateChunk(x, z);
        }
        
        const islandsInChunk = this.activeChunks.get(key)!;
        allActiveIslands.push(...islandsInChunk);
      }
    }

    // 2. Unload chunks that are out of range
    for (const key of this.activeChunks.keys()) {
      if (!neededChunkKeys.has(key)) {
        this.activeChunks.delete(key);
      }
    }

    return allActiveIslands;
  }

  private generateChunk(cx: number, cz: number): void {
    // Create a unique seed for this specific chunk coordinate
    const chunkSeed = this.globalSeed + (cx * 73856093) ^ (cz * 19349663);
    const rand = mulberry32(chunkSeed);

    const islands: IslandData[] = [];
    
    // Determine how many islands in this chunk (0 to 3)
    // 30% chance of 0, 40% chance of 1, 20% chance of 2, 10% chance of 3
    const r = rand();
    let count = 0;
    if (r > 0.3) count = 1;
    if (r > 0.7) count = 2;
    if (r > 0.9) count = 3;

    // Prevent islands from spawning exactly at 0,0 (Player spawn point)
    if (cx === 0 && cz === 0) count = 0; 

    for (let i = 0; i < count; i++) {
      // Random position within the chunk bounds
      const localX = rand() * this.chunkSize;
      const localZ = rand() * this.chunkSize;
      
      const worldX = cx * this.chunkSize + localX;
      const worldZ = cz * this.chunkSize + localZ;

      islands.push({
        id: `island_${cx}_${cz}_${i}`,
        position: [worldX, 0, worldZ],
        scale: 0.8 + rand() * 1.5,
        seed: Math.floor(rand() * 100000),
      });
    }

    this.activeChunks.set(`${cx},${cz}`, islands);
  }

  public reset(): void {
    this.activeChunks.clear();
  }
}

export const chunkManager = new ChunkManager(42);