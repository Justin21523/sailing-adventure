/**
 * notificationStore.ts
 * Extremely lightweight Zustand store strictly for rendering UI toasts.
 */

import { create } from 'zustand';
import type { NotificationType } from '@/core/systems/NotificationSystem';

export interface UINotification {
  id: string;
  message: string;
  type: NotificationType;
  progress: number; // 0.0 to 1.0 (used for fade-out animations)
}

export interface NotificationState {
  notifications: UINotification[];
  setNotifications: (notifs: UINotification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifs) => set({ notifications: notifs }),
}));