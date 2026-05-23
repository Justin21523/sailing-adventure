/**
 * PerformanceManager.ts (Fixed)
 * FIX: Removed unused 'lastTime' variable to resolve TS6133.
 */

import { useSettingsStore } from '@/stores/settingsStore';

export class PerformanceManager {
  private frameTimes: number[] = [];
  private checkInterval = 2.0;
  private timeSinceCheck = 0;
  private lowFpsThreshold = 30;

  public update(delta: number): void {
    this.timeSinceCheck += delta;
    this.frameTimes.push(delta);

    if (this.timeSinceCheck >= this.checkInterval) {
      this.evaluatePerformance();
      this.frameTimes = [];
      this.timeSinceCheck = 0;
    }
  }

  private evaluatePerformance(): void {
    if (this.frameTimes.length === 0) return;
    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const avgFps = 1 / avgDelta;

    if (avgFps < this.lowFpsThreshold) {
      const currentTier = useSettingsStore.getState().performanceTier;
      if (currentTier !== 'LOW') {
        console.warn(`[PerformanceManager] Low FPS (${avgFps.toFixed(1)}). Downgrading.`);
        useSettingsStore.getState().downgradeGraphics();
      }
    }
  }
}