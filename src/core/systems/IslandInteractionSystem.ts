/**
 * IslandInteractionSystem.ts
 * Monitors proximity to specific island landmarks (Lighthouses, Ruins).
 * Triggers unique island quests and visual states when the player sails close.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useUIStore } from '@/stores/uiStore';
import { useQuestStore } from '@/stores/questStore';
import { notificationSystem } from './NotificationSystem';
import type { IslandData } from './ChunkManager';

export class IslandInteractionSystem {
  private activeIslandId: string | null = null;
  private interactionRadius = 35; // Closer than docking radius

  public update(_delta: number, islands: IslandData[]): void {
    const shipPos = gameWorld.shipPhysics.position;
    const isDocked = useUIStore.getState().isDocked;
    
    let closestLandmark: IslandData | null = null;
    let minDistSq = Infinity;

    // Find closest island with a landmark
    for (const island of islands) {
      if (!island.hasLighthouse && !island.hasRuins) continue;
      
      const dx = shipPos.x - island.position[0];
      const dz = shipPos.z - island.position[2];
      const distSq = dx * dx + dz * dz;
      
      if (distSq < this.interactionRadius * this.interactionRadius && distSq < minDistSq) {
        minDistSq = distSq;
        closestLandmark = island;
      }
    }

    if (closestLandmark && !isDocked) {
      if (this.activeIslandId !== closestLandmark.id) {
        this.activeIslandId = closestLandmark.id;
        this.triggerLandmarkEvent(closestLandmark);
      }
    } else if (!closestLandmark && this.activeIslandId) {
      this.activeIslandId = null;
      useUIStore.getState().setPrompt('NONE');
    }
  }

  private triggerLandmarkEvent(island: IslandData): void {
    if (island.hasLighthouse) {
      notificationSystem.push('Ancient Lighthouse detected. Sail close to restore its light.', 'info', 4.0);
      useUIStore.getState().setPrompt('DOCK', island.id); // Reuse DOCK prompt for interaction
      
      // Add specific quest if not already active
      const quests = useQuestStore.getState().activeQuests;
      if (!quests.find(q => q.id === `lighthouse_${island.id}`)) {
        useQuestStore.getState().addQuest({
          id: `lighthouse_${island.id}`,
          title: 'Restore the Beacon',
          description: 'Dock at the lighthouse island to repair the light.',
          type: 'EXPLORE',
          targetAmount: 1,
          currentProgress: 0,
          reward: { gold: 100 },
          isCompleted: false,
          isTracked: true
        });
      }
    } else if (island.hasRuins) {
      notificationSystem.push('Glowing Ruins detected. Investigate the artifact.', 'info', 4.0);
      useUIStore.getState().setPrompt('DOCK', island.id);
      
      const quests = useQuestStore.getState().activeQuests;
      if (!quests.find(q => q.id === `ruins_${island.id}`)) {
        useQuestStore.getState().addQuest({
          id: `ruins_${island.id}`,
          title: 'Secrets of the Ancients',
          description: 'Dock at the ruins to recover the artifact.',
          type: 'EXPLORE',
          targetAmount: 1,
          currentProgress: 0,
          reward: { cloth: 30, gold: 50 },
          isCompleted: false,
          isTracked: true
        });
      }
    }
  }
}

export const islandInteractionSystem = new IslandInteractionSystem();
