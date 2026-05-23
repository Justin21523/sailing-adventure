import { create } from 'zustand';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'COLLECT' | 'EXPLORE' | 'TRAVEL';
  targetAmount: number;
  currentProgress: number;
  reward: { gold?: number; wood?: number; cloth?: number };
  isCompleted: boolean;
  isTracked: boolean;
}

interface QuestState {
  activeQuests: Quest[];
  addQuest: (quest: Quest) => void;
  updateProgress: (id: string, amount: number) => void;
  completeQuest: (id: string) => void;
}

export const useQuestStore = create<QuestState>()((set) => ({
  activeQuests: [],

  addQuest: (quest) =>
    set((state) => ({ activeQuests: [...state.activeQuests, quest] })),

  updateProgress: (id, amount) =>
    set((state) => ({
      activeQuests: state.activeQuests.map((q) =>
        q.id === id ? { ...q, currentProgress: q.currentProgress + amount } : q
      ),
    })),

  completeQuest: (id) =>
    set((state) => ({
      activeQuests: state.activeQuests.map((q) =>
        q.id === id ? { ...q, isCompleted: true } : q
      ),
    })),
}));
