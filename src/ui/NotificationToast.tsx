/**
 * NotificationToast.tsx
 * Renders floating UI alerts driven by the NotificationSystem.
 * Positioned at the top-center of the screen.
 */

import { useNotificationStore } from '@/stores/notificationStore';

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);

  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-800/90 border-green-400 text-green-100';
      case 'warning': return 'bg-red-800/90 border-red-400 text-red-100';
      case 'loot':    return 'bg-amber-800/90 border-amber-400 text-amber-100';
      default:        return 'bg-blue-800/90 border-blue-400 text-blue-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'loot':    return '🎁';
      default:        return 'ℹ️';
    }
  };

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-40 pointer-events-none w-80">
      {notifications.map((notif) => {
        // Calculate opacity based on progress (fade out in the last 20% of duration)
        const opacity = notif.progress > 0.8 ? 1 - ((notif.progress - 0.8) / 0.2) : 1;
        
        return (
          <div 
            key={notif.id}
            className={`glass-panel px-4 py-3 border-l-4 flex items-center gap-3 shadow-xl transition-all transform ${getStyles(notif.type)}`}
            style={{ opacity, transform: `translateY(${(1 - opacity) * -20}px)` }}
          >
            <span className="text-xl">{getIcon(notif.type)}</span>
            <span className="text-sm font-bold tracking-wide flex-grow">{notif.message}</span>
          </div>
        );
      })}
    </div>
  );
}