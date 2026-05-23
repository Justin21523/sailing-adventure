/**
 * EngineBridge.tsx
 * Headless R3F component that acts as the master ticker for all pure TS systems.
 * Keeps App.tsx clean by centralizing the useFrame update loop for managers.
 */

import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { weatherManager } from '@/core/systems/WeatherManager';
import { eventSystem, type LootEntity } from '@/core/systems/EventSystem';
import { PerformanceManager } from '@/core/engine/PerformanceManager';
import { notificationSystem } from '@/core/systems/NotificationSystem';
import { audioManager } from '@/core/audio/AudioManager';
import { gameWorld } from '@/core/engine/GameWorld';
import { useWeatherStore } from '@/stores/weatherStore';
import { collisionSystem } from '@/core/physics/CollisionSystem';
import { gameLifecycle } from '@/core/systems/GameLifecycle';
import { chunkManager } from '@/core/systems/ChunkManager';
import { questManager } from '@/core/systems/QuestManager';
import type { IslandData } from '@/core/systems/WorldGeneration'; 

interface EngineBridgeProps {
  onLootChange?: (loot: LootEntity[]) => void;
  onIslandsChange?: (islands: IslandData[]) => void;
}

export function EngineBridge({ onLootChange, onIslandsChange }: EngineBridgeProps) {
  const lastLootCount = useRef(0);
  const lastWeatherCondition = useRef('CLEAR');
  const performanceManager = useRef(new PerformanceManager());
  const lastChunkUpdate = useRef(0);

  useEffect(() => {
    questManager.initialize();
  }, []);
  
  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;
    const shipPos = gameWorld.shipPhysics.position;

    // 1. Tick Infinite World Generation (Throttled to every 0.5s to save CPU)
    lastChunkUpdate.current += safeDelta;
    if (lastChunkUpdate.current >= 0.5) {
      lastChunkUpdate.current = 0;
      const activeIslands = chunkManager.update(shipPos.x, shipPos.z);
      if (onIslandsChange) onIslandsChange(activeIslands);
    }

    // 1. Tick Weather & Time of Day
    weatherManager.update(safeDelta);
    // Trigger notification on weather change
    const currentCondition = useWeatherStore.getState().condition;
    if (currentCondition !== lastWeatherCondition.current) {
      lastWeatherCondition.current = currentCondition;
      if (currentCondition === 'STORM') {
        notificationSystem.push('A violent storm is approaching!', 'warning', 4.0);
      } else if (currentCondition === 'FOGGY') {
        notificationSystem.push('Dense fog limits visibility.', 'info', 3.0);
      }
    }

    // 2. Tick Dynamic Events (Loot Spawning)
    eventSystem.update(time);
    if (eventSystem.activeLoot.length !== lastLootCount.current) {
      lastLootCount.current = eventSystem.activeLoot.length;
      if (onLootChange) onLootChange([...eventSystem.activeLoot]);
    }

    // 4. Tick Collisions & Game Lifecycle
    // We need the active islands for collision. We can read them from the store or pass them.
    // For simplicity, we'll pass the latest generated islands via a ref or just let CollisionSystem read from a global if needed.
    // Here, we'll just use the callback approach. Let's assume onIslandsChange updates a state that CollisionSystem can access, 
    // OR we just pass the active islands directly if we store them in a ref.
    // To keep it pure TS, let's store active islands in ChunkManager and read them here.
    const activeIslands = chunkManager.update(shipPos.x, shipPos.z); // Fast cache read
    collisionSystem.update(safeDelta, activeIslands);
    gameLifecycle.update();
    
    // 5. Tick Quests
    questManager.update();
    
    // 4. Tick Performance & Notifications
    performanceManager.current.update(safeDelta);
    notificationSystem.update(safeDelta);

    // 5. Update Audio Ambience based on live physics & weather
    const shipSpeed = Math.abs(gameWorld.shipPhysics.speed);
    const windSpeed = gameWorld.windDynamics.getWindState(time).speed;
    audioManager.updateAmbience(shipSpeed, windSpeed);
  });

  return null; // Renders nothing to the DOM/Canvas
}