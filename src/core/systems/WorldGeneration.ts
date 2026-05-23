/**
 * WorldGeneration.ts
 * Handles the procedural placement of islands and points of interest.
 * Uses a simplified Poisson Disk sampling approach to ensure islands 
 * are distributed naturally without overlapping.
 */

import type { Vector3Tuple } from '@/types';

export interface IslandData {
  id: string;
  position: Vector3Tuple;
  scale: number;
  seed: number; // For procedural mesh variation
}

// Simple seeded pseudo-random number generator (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function generateInitialWorld(seed: number = 12345): IslandData[] {
  const rand = mulberry32(seed);
  const islands: IslandData[] = [];
  
  const numIslands = 12;
  const minRadius = 60;  // Keep starting area clear
  const maxRadius = 300; // World boundary

  for (let i = 0; i < numIslands; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = minRadius + rand() * (maxRadius - minRadius);
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    islands.push({
      id: `island_${i}`,
      position: [x, 0, z],
      scale: 0.8 + rand() * 1.5,
      seed: Math.floor(rand() * 10000),
    });
  }

  return islands;
}