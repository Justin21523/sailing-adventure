/**
 * AnomalyManager.ts
 * Spawns and manages dynamic ocean hazards like Whirlpools and Kraken attacks.
 * Applies physical forces to the ship when in proximity.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { notificationSystem } from './NotificationSystem';

export type AnomalyType = 'WHIRLPOOL' | 'KRAKEN';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  x: number;
  z: number;
  radius: number;
  life: number;
}

export class AnomalyManager {
  public activeAnomalies: Anomaly[] = [];
  private spawnTimer = 0;
  // First anomaly appears quickly so the whirlpool/kraken effect is visible early;
  // subsequent ones use the normal 45-90s cadence.
  private nextSpawnDelay = 12;
  private idCounter = 0;

  public update(delta: number): void {
    this.spawnTimer += delta;
    const shipPos = gameWorld.shipPhysics.position;

    if (this.spawnTimer > this.nextSpawnDelay) {
      this.spawnTimer = 0;
      this.nextSpawnDelay = 45 + Math.random() * 45;
      this.spawnAnomaly(shipPos.x, shipPos.z);
    }

    for (let i = this.activeAnomalies.length - 1; i >= 0; i--) {
      const a = this.activeAnomalies[i];
      a.life -= delta;
      
      if (a.life <= 0) {
        this.activeAnomalies.splice(i, 1);
        continue;
      }

      const dx = a.x - shipPos.x;
      const dz = a.z - shipPos.z;
      const distSq = dx * dx + dz * dz;
      const dist = Math.sqrt(distSq);

      if (dist < a.radius * 2 && a.type === 'WHIRLPOOL') {
        const pullStrength = Math.max(0, 1.0 - (dist / (a.radius * 2))) * 15.0;
        const nx = dx / dist;
        const nz = dz / dist;
        gameWorld.shipPhysics.velocity.x += nx * pullStrength * delta;
        gameWorld.shipPhysics.velocity.z += nz * pullStrength * delta;
        gameWorld.shipPhysics.heading += (nx * nz) * delta * 2.0; 
      }
    }
  }

  private spawnAnomaly(playerX: number, playerZ: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 40; 
    const x = playerX + Math.cos(angle) * dist;
    const z = playerZ + Math.sin(angle) * dist;
    
    const type: AnomalyType = Math.random() > 0.5 ? 'WHIRLPOOL' : 'KRAKEN';
    
    this.activeAnomalies.push({
      id: `anomaly_${this.idCounter++}`,
      type,
      x, z,
      radius: type === 'WHIRLPOOL' ? 25 : 15,
      life: 20.0 
    });

    if (type === 'WHIRLPOOL') {
      notificationSystem.push('Waters are swirling ahead! Watch for whirlpools!', 'warning', 3);
    } else {
      notificationSystem.push('Something massive stirs beneath the waves...', 'warning', 3);
    }
  }
}

export const anomalyManager = new AnomalyManager();