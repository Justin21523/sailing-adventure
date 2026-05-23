/**
 * CollisionSystem.ts
 * Handles physical collisions between the ship and static world obstacles (Islands).
 * Uses simple 2D circular collision detection on the XZ plane for high performance.
 * Applies bounce physics, calculates impact damage, and triggers VFX/Shake.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useShipStore } from '@/stores/shipStore';
import { notificationSystem } from '@/core/systems/NotificationSystem';
import { cameraShakeState } from '@/components/effects/CameraShake';
import type { IslandData } from '@/core/systems/WorldGeneration';

export class CollisionSystem {
  private collisionCooldown = 0;
  private readonly COOLDOWN_TIME = 1.0; // Prevents damage spamming
  private readonly SHIP_RADIUS = 4.0;

  public update(delta: number, islands: IslandData[]): void {
    this.collisionCooldown -= delta;
    if (this.collisionCooldown > 0) return;

    const shipPos = gameWorld.shipPhysics.position;
    const shipSpeed = Math.abs(gameWorld.shipPhysics.speed);

    for (const island of islands) {
      const dx = shipPos.x - island.position[0];
      const dz = shipPos.z - island.position[2];
      const distSq = dx * dx + dz * dz;
      
      // Approximate island collision radius based on its procedural scale
      // Base visual radius in Island.tsx is roughly 10 units
      const islandRadius = 10 * island.scale;
      const collisionDist = islandRadius + this.SHIP_RADIUS;

      if (distSq < collisionDist * collisionDist) {
        this.handleCollision(island, shipSpeed, dx, dz, distSq);
        break; // Only process one collision per frame to save CPU
      }
    }
  }

  private handleCollision(island: IslandData, speed: number, dx: number, dz: number, distSq: number): void {
    const physics = gameWorld.shipPhysics;
    
    // 1. Resolve Penetration (Push ship out of the island)
    const dist = Math.sqrt(distSq);
    const nx = dx / dist; // Normal X
    const nz = dz / dist; // Normal Z
    
    const penetration = (this.SHIP_RADIUS + 10 * island.scale) - dist;
    physics.position.x += nx * penetration;
    physics.position.z += nz * penetration;
    
    // 2. Reflect Velocity (Bounce off)
    physics.speed *= -0.3; // Lose 70% of energy on impact
    physics.velocity.x = nx * Math.abs(physics.speed);
    physics.velocity.z = nz * Math.abs(physics.speed);

    // 3. Calculate Damage based on impact speed
    if (speed > 3.0) {
      const damage = Math.floor(speed * 2.5);
      useShipStore.getState().takeDamage(damage);
      notificationSystem.push(`Impact! Hull took ${damage} damage.`, 'warning', 2.5);
      
      // 4. Trigger Camera Shake proportional to impact force
      cameraShakeState.trigger(Math.min(speed * 0.5, 3.0), 0.5);
    }

    this.collisionCooldown = this.COOLDOWN_TIME;
  }
}

export const collisionSystem = new CollisionSystem();