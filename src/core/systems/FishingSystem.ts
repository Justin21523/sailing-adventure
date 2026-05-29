/**
 * FishingSystem.ts
 * Manages the state machine and logic for the fishing minigame.
 * States: IDLE -> CASTING -> WAITING -> BITE -> REELING/SUCCESS/FAIL
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useGameStore } from '@/stores/gameStore';
import { notificationSystem } from './NotificationSystem';
import { audioManager } from '../audio/AudioManager';

export type FishingState = 'IDLE' | 'CASTING' | 'WAITING' | 'BITE' | 'REELING';

export class FishingSystem {
  public state: FishingState = 'IDLE';
  public timer: number = 0;
  public biteWindow: number = 0;
  
  // World coordinates of the bobber
  public bobberX: number = 0;
  public bobberY: number = 0;
  public bobberZ: number = 0;

  private readonly CAST_TIME = 0.5;
  private readonly MIN_WAIT = 3.0;
  private readonly MAX_WAIT = 8.0;
  private readonly BITE_DURATION = 2.0;

  public cast(): void {
    if (this.state !== 'IDLE') return;
    
    const speed = Math.abs(gameWorld.shipPhysics.speed);
    if (speed > 3.0) {
      notificationSystem.push('Ship is moving too fast to fish!', 'warning', 2);
      return;
    }

    this.state = 'CASTING';
    this.timer = this.CAST_TIME;
    
    // Calculate bobber position (starboard side of the ship)
    const pos = gameWorld.shipPhysics.position;
    const heading = gameWorld.shipPhysics.heading;
    const rightX = Math.cos(heading);
    const rightZ = -Math.sin(heading);
    
    this.bobberX = pos.x + rightX * 5;
    this.bobberZ = pos.z + rightZ * 5;
    this.bobberY = 0.5;
  }

  public reel(): void {
    if (this.state === 'BITE') {
      this.state = 'REELING';
      this.timer = 0.5; // Reeling animation time
      
      // Catch fish!
      const gold = 15 + Math.floor(Math.random() * 25);
      const cloth = Math.random() > 0.8 ? 3 : 0;
      
      useGameStore.getState().addResource('gold', gold);
      if (cloth > 0) useGameStore.getState().addResource('cloth', cloth);
      
      notificationSystem.push(`Caught a fish! +${gold} Gold`, 'success', 2);
      audioManager.playPickupSound();
    } else if (this.state === 'WAITING' || this.state === 'CASTING') {
      // Pulled too early
      this.state = 'IDLE';
      notificationSystem.push('Pulled too early! The fish got away.', 'info', 2);
    }
  }

  public update(delta: number): void {
    if (this.state === 'IDLE') return;

    this.timer -= delta;

    if (this.state === 'CASTING' && this.timer <= 0) {
      this.state = 'WAITING';
      this.timer = this.MIN_WAIT + Math.random() * (this.MAX_WAIT - this.MIN_WAIT);
    } 
    else if (this.state === 'WAITING' && this.timer <= 0) {
      this.state = 'BITE';
      this.biteWindow = this.BITE_DURATION;
      audioManager.playPickupSound(); // Splash/bite sound cue
    } 
    else if (this.state === 'BITE') {
      this.biteWindow -= delta;
      if (this.biteWindow <= 0) {
        this.state = 'IDLE';
        notificationSystem.push('The fish got away...', 'info', 2);
      }
    } 
    else if (this.state === 'REELING' && this.timer <= 0) {
      this.state = 'IDLE';
    }
  }
}

export const fishingSystem = new FishingSystem();