/**
 * ProjectilePhysics.ts
 * Pure TS physics engine for cannonballs.
 * Handles trajectory (gravity), lifetime, and collision detection against ships and water.
 * Uses an object pool to prevent garbage collection spikes during heavy firefights.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { enemyAI } from '@/core/systems/EnemyAI';
import { useShipStore } from '@/stores/shipStore';
import { cameraShakeState } from '@/components/effects/CameraShake';

export type ProjectileOwner = 'player' | 'enemy';

export interface Projectile {
  id: number;
  active: boolean;
  posX: number; posY: number; posZ: number;
  velX: number; velY: number; velZ: number;
  life: number;
  owner: ProjectileOwner;
}

export interface ImpactEvent {
  x: number; y: number; z: number;
  type: 'explosion' | 'splash';
}

export class ProjectilePhysics {
  private pool: Projectile[] = [];
  private readonly MAX_PROJECTILES = 100;
  private readonly GRAVITY = 15.0;
  
  // Callbacks for VFX systems to listen to
  public onImpact: (event: ImpactEvent) => void = () => {};

  constructor() {
    // Pre-allocate pool
    for (let i = 0; i < this.MAX_PROJECTILES; i++) {
      this.pool.push({
        id: i, active: false,
        posX: 0, posY: 0, posZ: 0,
        velX: 0, velY: 0, velZ: 0,
        life: 0, owner: 'player'
      });
    }
  }

  public spawn(x: number, y: number, z: number, dirX: number, dirY: number, dirZ: number, speed: number, owner: ProjectileOwner): void {
    const p = this.pool.find(p => !p.active);
    if (!p) return; // Pool exhausted

    p.active = true;
    p.posX = x; p.posY = y; p.posZ = z;
    p.velX = dirX * speed;
    p.velY = dirY * speed;
    p.velZ = dirZ * speed;
    p.life = 4.0; // 4 seconds max flight time
    p.owner = owner;
  }

  public update(delta: number): void {
    const shipPos = gameWorld.shipPhysics.position;
    const enemies = enemyAI.getEnemies();

    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Apply Gravity
      p.velY -= this.GRAVITY * delta;

      // Integrate Position
      p.posX += p.velX * delta;
      p.posY += p.velY * delta;
      p.posZ += p.velZ * delta;

      // 1. Water Collision
      if (p.posY <= 0.2) {
        p.active = false;
        this.onImpact({ x: p.posX, y: 0, z: p.posZ, type: 'splash' });
        continue;
      }

      // 2. Ship Collision
      if (p.owner === 'enemy') {
        const dx = p.posX - shipPos.x;
        const dz = p.posZ - shipPos.z;
        const dy = p.posY - shipPos.y;
        if (dx * dx + dz * dz < 16 && Math.abs(dy) < 4) { // 4 unit radius hitbox
          p.active = false;
          useShipStore.getState().takeDamage(15);
          cameraShakeState.trigger(1.5, 0.3);
          this.onImpact({ x: p.posX, y: p.posY, z: p.posZ, type: 'explosion' });
          continue;
        }
      }

      // 3. Enemy Collision
      if (p.owner === 'player') {
        for (const enemy of enemies) {
          if (enemy.state === 'SINKING') continue;
          const dx = p.posX - enemy.posX;
          const dz = p.posZ - enemy.posZ;
          const dy = p.posY - enemy.posY;
          if (dx * dx + dz * dz < 25 && Math.abs(dy) < 5) { // 5 unit radius hitbox
            p.active = false;
            enemyAI.damageEnemy(enemy.id, 25);
            this.onImpact({ x: p.posX, y: p.posY, z: p.posZ, type: 'explosion' });
            break;
          }
        }
      }
    }
  }

  public getActiveProjectiles(): Projectile[] {
    return this.pool.filter(p => p.active);
  }
}

export const projectilePhysics = new ProjectilePhysics();