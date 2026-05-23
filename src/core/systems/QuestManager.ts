/**
 * QuestManager.ts
 * Generates, tracks, and rewards quests based on player actions.
 * Listens to game events (via stores) to update progress automatically.
 */

import { useQuestStore, type Quest } from '@/stores/questStore';
import { useGameStore } from '@/stores/gameStore';
import { notificationSystem } from './NotificationSystem';
import { audioManager } from '../audio/AudioManager';

export class QuestManager {
  private initialized = false;
  private questCounter = 0;

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    // Generate starting quests
    this.generateQuest('COLLECT', 'Lumberjack', 'Collect 50 Wood from islands or crates.', 50, { gold: 50 });
    this.generateQuest('EXPLORE', 'Cartographer', 'Dock and explore 3 different islands.', 3, { wood: 30, cloth: 10 });
    this.generateQuest('COLLECT', 'Treasure Hunter', 'Accumulate 200 Gold.', 200, { cloth: 20 });
  }

  /**
   * Called every frame to check for quest completion and auto-grant rewards.
   */
  public update(): void {
    const { activeQuests } = useQuestStore.getState();
    const resources = useGameStore.getState().resources;

    for (const quest of activeQuests) {
      if (quest.isCompleted) continue;

      let isReadyToComplete = false;

      // Check progress based on quest type
      if (quest.type === 'COLLECT') {
        if (quest.title.includes('Wood') && resources.wood >= quest.targetAmount) isReadyToComplete = true;
        if (quest.title.includes('Gold') && resources.gold >= quest.targetAmount) isReadyToComplete = true;
      }
      
      // For EXPLORE and TRAVEL, progress is pushed via events (updateProgress)
      if (quest.type === 'EXPLORE' && quest.currentProgress >= quest.targetAmount) isReadyToComplete = true;

      if (isReadyToComplete) {
        this.completeQuest(quest);
      }
    }
  }

  public pushEvent(type: 'EXPLORE' | 'COLLECT', amount: number = 1): void {
    const { activeQuests, updateProgress } = useQuestStore.getState();
    for (const quest of activeQuests) {
      if (quest.type === type && !quest.isCompleted) {
        updateProgress(quest.id, amount);
      }
    }
  }

  private generateQuest(type: 'COLLECT' | 'EXPLORE' | 'TRAVEL', title: string, desc: string, target: number, reward: any): void {
    const quest: Quest = {
      id: `quest_${this.questCounter++}`,
      title,
      description: desc,
      type,
      targetAmount: target,
      currentProgress: 0,
      reward,
      isCompleted: false,
      isTracked: this.questCounter <= 2 // Auto-track first 2 quests
    };
    useQuestStore.getState().addQuest(quest);
  }

  private completeQuest(quest: Quest): void {
    useQuestStore.getState().completeQuest(quest.id);
    
    // Grant rewards
    const gameStore = useGameStore.getState();
    if (quest.reward.gold) gameStore.addResource('gold', quest.reward.gold);
    if (quest.reward.wood) gameStore.addResource('wood', quest.reward.wood);
    if (quest.reward.cloth) gameStore.addResource('cloth', quest.reward.cloth);

    notificationSystem.push(`Quest Complete: ${quest.title}!`, 'success', 4.0);
    audioManager.playPickupSound(); // Reuse pickup sound for quest complete
    
    // Generate a follow-up quest (Endless loop)
    const nextTarget = Math.floor(quest.targetAmount * 1.5);
    this.generateQuest(quest.type, `${quest.title} II`, quest.description, nextTarget, quest.reward);
  }
}

export const questManager = new QuestManager();