/**
 * GameLifecycle.ts
 * Monitors ship health and triggers the Game Over state when the hull is destroyed.
 */

import { useShipStore } from '@/stores/shipStore';
import { useUIStore } from '@/stores/uiStore';
import { notificationSystem } from './NotificationSystem';

export class GameLifecycle {
  public update(): void {
    const hp = useShipStore.getState().hullHealth;
    const isGameOver = useUIStore.getState().showGameOver;
    
    if (hp <= 0 && !isGameOver) {
      useUIStore.getState().triggerGameOver();
      notificationSystem.push('Your ship has sunk! The sea claims another vessel.', 'warning', 5.0);
    }
  }
}

export const gameLifecycle = new GameLifecycle();