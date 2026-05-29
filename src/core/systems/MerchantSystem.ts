/**
 * MerchantSystem.ts
 * Spawns and steers neutral merchant ships that roam the open sea.
 * Sail close to one to trade with it (see MerchantTradePanel), or open fire to
 * sink it and loot the floating wreckage. Mirrors the EnemyAI lifecycle but the
 * merchants never attack — they just cruise and despawn once far behind you.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { notificationSystem } from './NotificationSystem';
import { salvageSystem } from './SalvageSystem';
import { useUIStore } from '@/stores/uiStore';

export type MerchantState = 'SAILING' | 'SINKING';

export interface Merchant {
  id: string;
  posX: number; posY: number; posZ: number;
  heading: number;
  speed: number;
  hp: number;
  maxHp: number;
  state: MerchantState;
  sinkTimer: number;
  driftPhase: number;
}

const MAX_MERCHANTS = 3;
const TRADE_RADIUS = 30;     // how close you must sail to open the trade panel
const DESPAWN_RADIUS = 460;  // cull merchants that drift too far away

export class MerchantSystem {
  public merchants: Merchant[] = [];
  private spawnTimer = 0;
  // First merchant appears quickly so sea trade is visible early.
  private nextSpawnDelay = 8;
  private idCounter = 0;
  private elapsed = 0;

  public update(delta: number): void {
    this.elapsed += delta;
    const shipPos = gameWorld.shipPhysics.position;

    this.spawnTimer += delta;
    if (this.spawnTimer > this.nextSpawnDelay && this.merchants.length < MAX_MERCHANTS) {
      this.spawnTimer = 0;
      this.nextSpawnDelay = 22 + Math.random() * 20;
      this.spawnMerchant(shipPos.x, shipPos.z);
    }

    let nearest: Merchant | null = null;
    let nearestDist = TRADE_RADIUS;

    for (let i = this.merchants.length - 1; i >= 0; i--) {
      const m = this.merchants[i];

      if (m.state === 'SINKING') {
        m.sinkTimer -= delta;
        m.posY -= delta * 1.8; // sink beneath the waves
        if (m.sinkTimer <= 0) this.merchants.splice(i, 1);
        continue;
      }

      // Gentle wander so the route looks natural.
      m.heading += Math.sin(this.elapsed * 0.4 + m.driftPhase) * 0.25 * delta;
      m.posX += Math.sin(m.heading) * m.speed * delta;
      m.posZ += Math.cos(m.heading) * m.speed * delta;

      const dx = shipPos.x - m.posX;
      const dz = shipPos.z - m.posZ;
      const distSq = dx * dx + dz * dz;

      if (distSq > DESPAWN_RADIUS * DESPAWN_RADIUS) {
        this.merchants.splice(i, 1);
        continue;
      }

      const dist = Math.sqrt(distSq);
      if (dist < nearestDist) {
        nearest = m;
        nearestDist = dist;
      }
    }

    // Publish proximity to the UI (only while sailing the open sea).
    const ui = useUIStore.getState();
    if (!ui.isDocked) {
      const id = nearest ? nearest.id : null;
      if (ui.activeMerchantId !== id) ui.setActiveMerchant(id);
    } else if (ui.activeMerchantId !== null) {
      ui.setActiveMerchant(null);
    }
  }

  private spawnMerchant(playerX: number, playerZ: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 130 + Math.random() * 50;
    const x = playerX + Math.cos(angle) * dist;
    const z = playerZ + Math.sin(angle) * dist;

    this.merchants.push({
      id: `merchant_${this.idCounter++}`,
      posX: x, posY: 0, posZ: z,
      heading: Math.random() * Math.PI * 2,
      speed: 3 + Math.random() * 2,
      hp: 60,
      maxHp: 60,
      state: 'SAILING',
      sinkTimer: 3.0,
      driftPhase: Math.random() * Math.PI * 2,
    });

    notificationSystem.push('A merchant vessel is sailing nearby — approach to trade.', 'info', 3);
  }

  public damageMerchant(id: string, amount: number): void {
    const m = this.merchants.find((mm) => mm.id === id);
    if (!m || m.state === 'SINKING') return;

    m.hp -= amount;
    if (m.hp <= 0) {
      m.state = 'SINKING';
      m.speed = 0;
      salvageSystem.spawnWreckage(m.posX, m.posZ);
      notificationSystem.push('Merchant sunk! Salvage is floating nearby.', 'loot', 3);

      const ui = useUIStore.getState();
      if (ui.activeMerchantId === id) ui.setActiveMerchant(null);
    }
  }

  public getMerchants(): Merchant[] {
    return this.merchants;
  }

  public getMerchant(id: string): Merchant | undefined {
    return this.merchants.find((m) => m.id === id);
  }
}

export const merchantSystem = new MerchantSystem();
