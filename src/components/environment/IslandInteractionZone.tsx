/**
 * IslandInteractionZone.tsx
 * Invisible trigger zone around islands.
 * Detects when the player is close and slow enough to dock, 
 * and handles the automatic HP repair logic while docked.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { gameWorld } from '@/core/engine/GameWorld';
import { useUIStore } from '@/stores/uiStore';
import { useShipStore } from '@/stores/shipStore';
import type { IslandData } from '@/core/systems/WorldGeneration';

interface IslandInteractionZoneProps {
  data: IslandData;
}

const DOCK_RADIUS = 25; // Distance to trigger docking prompt
const DOCK_SPEED_THRESHOLD = 1.5; // Must be moving slower than this to dock

export function IslandInteractionZone({ data }: IslandInteractionZoneProps) {
  const lastPromptState = useRef(false);
  const repairTimer = useRef(0);

  useFrame((_, delta) => {
    const shipPos = gameWorld.shipPhysics.position;
    const shipSpeed = Math.abs(gameWorld.shipPhysics.speed);
    const { isDocked, targetIslandId } = useUIStore.getState();

    const dx = shipPos.x - data.position[0];
    const dz = shipPos.z - data.position[2];
    const distSq = dx * dx + dz * dz;
    const dockRadiusSq = DOCK_RADIUS * DOCK_RADIUS;

    const isInZone = distSq < dockRadiusSq;
    const isSlowEnough = shipSpeed < DOCK_SPEED_THRESHOLD;

    // 1. Handle Prompt Display (Show "Press E to Dock" if close and slow)
    if (isInZone && isSlowEnough && !isDocked) {
      if (!lastPromptState.current) {
        useUIStore.getState().setPrompt('DOCK');
        lastPromptState.current = true;
      }
    } else if (lastPromptState.current && !isDocked) {
      useUIStore.getState().setPrompt('NONE');
      lastPromptState.current = false;
    }

    // 2. Handle Docking & Automatic Repairing
    if (isDocked && targetIslandId === data.id) {
      repairTimer.current += delta;
      if (repairTimer.current >= 1.0) { // Repair 5 HP every second while docked
        repairTimer.current = 0;
        useShipStore.getState().repair(5);
      }
    } else {
      repairTimer.current = 0;
    }
  });

  // Purely logical component, renders nothing to the Canvas
  return null;
}