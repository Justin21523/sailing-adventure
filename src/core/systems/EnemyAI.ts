/**
 * EnemyAI.ts
 * Manages the spawning, state machine, and navigation of enemy pirate ships.
 * States: PATROL (wander), CHASE (pursue player), ATTACK (broadside volley), SINKING.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { projectilePhysics } from '@/core/physics/ProjectilePhysics';
import { salvageSystem } from './SalvageSystem';

export type EnemyState = 'PATROL' | 'CHASE' | 'ATTACK' | 'SINKING';

export interface EnemyShip {
  id: string;
  posX: number; posY: number; posZ: number;
  heading: number;
  speed: number;
  hp: number;
  maxHp: number;
  state: EnemyState;
  targetX: number;
  targetZ: number;
  fireCooldown: number;
  sinkTimer: number;
}

export class EnemyAI {
  private enemies: EnemyShip[] = [];
  private spawnTimer = 0;
  private idCounter = 0;
  
  private readonly DETECT_RADIUS = 120;
  private readonly ATTACK_RADIUS = 60;
  private readonly MAX_ENEMIES = 4;

  public update(delta: number): void {
    const shipPos = gameWorld.shipPhysics.position;
    this.spawnTimer += delta;

    // Spawn logic: Periodically spawn enemies if below max and player is moving
    if (this.spawnTimer > 15 && this.enemies.length < this.MAX_ENEMIES) {
      this.spawnTimer = 0;
      this.spawnEnemy(shipPos.x, shipPos.z);
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      
      if (e.state === 'SINKING') {
        e.sinkTimer -= delta;
        e.posY -= delta * 2; // Sink below water
        if (e.sinkTimer <= 0) {
          salvageSystem.spawnWreckage(e.posX, e.posZ);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      const dx = shipPos.x - e.posX;
      const dz = shipPos.z - e.posZ;
      const distSq = dx * dx + dz * dz;
      const dist = Math.sqrt(distSq);

      // State Machine Transitions
      if (dist < this.ATTACK_RADIUS) {
        e.state = 'ATTACK';
      } else if (dist < this.DETECT_RADIUS) {
        e.state = 'CHASE';
      } else {
        e.state = 'PATROL';
      }

      // Behavior Execution
      if (e.state === 'PATROL') {
        const tDx = e.targetX - e.posX;
        const tDz = e.targetZ - e.posZ;
        if (tDx * tDx + tDz * tDz < 100) {
          // Pick new random patrol point
          e.targetX = e.posX + (Math.random() - 0.5) * 100;
          e.targetZ = e.posZ + (Math.random() - 0.5) * 100;
        }
        e.heading = Math.atan2(tDx, tDz);
        e.speed = 4;
      } 
      else if (e.state === 'CHASE') {
        e.heading = Math.atan2(dx, dz);
        e.speed = 8; // Faster than player base speed to catch up
      } 
      else if (e.state === 'ATTACK') {
        // Circle the player
        const perpX = -dz / dist;
        const perpZ = dx / dist;
        e.heading = Math.atan2(perpX, perpZ);
        e.speed = 5;

        // Fire Cannons
        e.fireCooldown -= delta;
        if (e.fireCooldown <= 0) {
          e.fireCooldown = 3.0 + Math.random() * 2.0;
          this.fireEnemyCannons(e, shipPos.x, shipPos.z);
        }
      }

      // Integrate Physics
      e.posX += Math.sin(e.heading) * e.speed * delta;
      e.posZ += Math.cos(e.heading) * e.speed * delta;
    }
  }

  private spawnEnemy(playerX: number, playerZ: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 50; // Spawn just outside detection radius
    const x = playerX + Math.cos(angle) * dist;
    const z = playerZ + Math.sin(angle) * dist;

    this.enemies.push({
      id: `enemy_${this.idCounter++}`,
      posX: x, posY: 0, posZ: z,
      heading: Math.random() * Math.PI * 2,
      speed: 4,
      hp: 100,
      maxHp: 100,
      state: 'PATROL',
      targetX: x + (Math.random() - 0.5) * 100,
      targetZ: z + (Math.random() - 0.5) * 100,
      fireCooldown: 2.0,
      sinkTimer: 3.0
    });
  }

  private fireEnemyCannons(e: EnemyShip, targetX: number, targetZ: number): void {
    const dx = targetX - e.posX;
    const dz = targetZ - e.posZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // Normalize and add slight inaccuracy
    const dirX = (dx / dist) + (Math.random() - 0.5) * 0.2;
    const dirZ = (dz / dist) + (Math.random() - 0.5) * 0.2;
    
    // Calculate required Y velocity to hit target at distance (parabolic arc)
    // Simplified: just aim slightly up
    const dirY = 0.3; 

    projectilePhysics.spawn(e.posX, e.posY + 2, e.posZ, dirX, dirY, dirZ, 40, 'enemy');
  }

  public damageEnemy(id: string, amount: number): void {
    const e = this.enemies.find(en => en.id === id);
    if (!e || e.state === 'SINKING') return;
    
    e.hp -= amount;
    if (e.hp <= 0) {
      e.state = 'SINKING';
      e.speed = 0;
    }
  }

  public getEnemies(): EnemyShip[] {
    return this.enemies;
  }
}

export const enemyAI = new EnemyAI();