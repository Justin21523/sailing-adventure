/**
 * NotificationSystem.ts
 * Pure TS queue manager for UI toasts and alerts.
 * Handles lifecycle (spawn, duration, despawn) without triggering React renders.
 */

import { useNotificationStore } from '@/stores/notificationStore';

export type NotificationType = 'info' | 'success' | 'warning' | 'loot';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number; // seconds
  elapsed: number;
}

export class NotificationSystem {
  private queue: Notification[] = [];
  private idCounter = 0;

  public push(message: string, type: NotificationType = 'info', duration: number = 3.0): void {
    const newNotif: Notification = {
      id: `notif_${this.idCounter++}`,
      message,
      type,
      duration,
      elapsed: 0,
    };
    
    this.queue.push(newNotif);
    this.syncToStore();
  }

  public update(delta: number): void {
    let changed = false;
    
    for (let i = this.queue.length - 1; i >= 0; i--) {
      this.queue[i].elapsed += delta;
      if (this.queue[i].elapsed >= this.queue[i].duration) {
        this.queue.splice(i, 1);
        changed = true;
      }
    }

    if (changed) {
      this.syncToStore();
    }
  }

  private syncToStore(): void {
    // Map to lightweight objects for React
    const uiNotifs = this.queue.map(n => ({
      id: n.id,
      message: n.message,
      type: n.type,
      progress: n.elapsed / n.duration
    }));
    useNotificationStore.getState().setNotifications(uiNotifs);
  }
}

export const notificationSystem = new NotificationSystem();