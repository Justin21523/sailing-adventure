/**
 * BuoyancySystem.ts
 * Calculates wave heights and applies buoyancy forces to the ship.
 * Since the ocean waves are generated on the GPU via shaders, we must replicate 
 * the exact same mathematical wave function on the CPU to sample heights accurately.
 */

import type { Vec3 } from './ShipPhysics';

// Must perfectly match the vertex shader logic in OceanMesh.tsx
export function getOceanHeight(x: number, z: number, time: number, waveHeightMultiplier: number = 0.6): number {
  const wave1 = Math.sin(x * 0.05 + time * 0.8) * 1.5;
  const wave2 = Math.sin(z * 0.08 + time * 1.2) * 1.0;
  const wave3 = Math.sin((x + z) * 0.03 + time * 0.5) * 2.5;
  return (wave1 + wave2 + wave3) * waveHeightMultiplier;
}

export interface BuoyancyResult {
  targetY: number;
  targetPitch: number; // Rotation around X axis
  targetRoll: number;  // Rotation around Z axis
}

export class BuoyancySystem {
  // Sampling points relative to the ship's center (Local Space)
  // [x, z] offsets for Bow, Stern, Port, Starboard
  private readonly samplePoints: [number, number][] = [
    [0, 3.5],   // Bow (Front)
    [0, -3.5],  // Stern (Back)
    [-1.2, 0],  // Port (Left)
    [1.2, 0],   // Starboard (Right)
  ];

  /**
   * Calculates the target Y position and rotational tilt based on the ocean surface.
   * @param position Ship's current world position (X, Z are used, Y is ignored)
   * @param heading Ship's current yaw rotation in radians
   * @param time Current elapsed time for wave animation
   */
  public calculate(position: Vec3, heading: number, time: number): BuoyancyResult {
    let totalHeight = 0;
    const worldHeights: number[] = [];
    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    // 1. Sample wave heights at specific points on the hull
    for (const [localX, localZ] of this.samplePoints) {
      // Transform local offset to world space
      const worldX = position.x + (localX * cosH - localZ * sinH);
      const worldZ = position.z + (localX * sinH + localZ * cosH);
      
      const h = getOceanHeight(worldX, worldZ, time);
      worldHeights.push(h);
      totalHeight += h;
    }

    // 2. Calculate average height for vertical bobbing (Heave)
    // Add a small constant to keep the hull slightly above the exact wave trough
    const targetY = (totalHeight / this.samplePoints.length) + 0.8; 

    // 3. Calculate Pitch (X rotation) based on Bow vs Stern height difference
    const bowHeight = worldHeights[0];
    const sternHeight = worldHeights[1];
    const pitchDiff = bowHeight - sternHeight;
    // Map height difference to radians. 0.15 limits the maximum tilt angle
    const targetPitch = Math.atan2(pitchDiff, 7.0) * 0.8; 

    // 4. Calculate Roll (Z rotation) based on Port vs Starboard height difference
    const portHeight = worldHeights[2];
    const starboardHeight = worldHeights[3];
    const rollDiff = portHeight - starboardHeight;
    const targetRoll = Math.atan2(rollDiff, 2.4) * 0.8;

    return { targetY, targetPitch, targetRoll };
  }
  
  /**
   * Resets physics state to initial values.
   */
  public reset(): void {
    // No internal state to reset for now, but method is here for future extensibility
  }
}