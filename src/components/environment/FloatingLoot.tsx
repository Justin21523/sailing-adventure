/**
 * FloatingLoot.tsx
 * Visual representation of a floating resource crate.
 * Handles its own buoyancy animation and collision detection with the player ship.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';
import { eventSystem, type LootEntity } from '@/core/systems/EventSystem';
import { useGameStore } from '@/stores/gameStore';
import { audioManager } from '@/core/audio/AudioManager';

interface FloatingLootProps {
  data: LootEntity;
}

const PICKUP_RADIUS_SQ = 4 * 4; // 4 units collision radius

export function FloatingLoot({ data }: FloatingLootProps) {
  const groupRef = useRef<THREE.Group>(null);
  const collectedRef = useRef(false);

  // Determine visual theme based on loot type
  const color = data.type === 'GOLD' ? '#FFD700' : data.type === 'CLOTH' ? '#F5F5DC' : '#8B5A2B';
  const bandColor = data.type === 'GOLD' ? '#B8860B' : '#424242';

  useFrame((state) => {
    if (!groupRef.current || collectedRef.current) return;

    const time = state.clock.elapsedTime;
    const shipPos = gameWorld.shipPhysics.position;
    const [x, , z] = data.position;

    // 1. Buoyancy: Bobbing on the waves
    const waveY = getOceanHeight(x, z, time, 0.6);
    groupRef.current.position.y = waveY + 0.4;
    groupRef.current.rotation.y = time * 0.3;
    groupRef.current.rotation.z = Math.sin(time * 1.2 + x) * 0.15;

    // 2. Collision Detection
    const dx = x - shipPos.x;
    const dz = z - shipPos.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < PICKUP_RADIUS_SQ) {
      collectedRef.current = true;
      
      // Map loot type to resource store key
      const resourceType = data.type.toLowerCase() as 'wood' | 'gold' | 'cloth';
      const amount = data.type === 'GOLD' ? 15 : 8;
      
      // Update global state
      useGameStore.getState().addResource(resourceType, amount);
      // Trigger procedural audio feedback
      audioManager.playPickupSound();
      // Remove from world simulation
      eventSystem.removeLoot(data.id);
    }
  });

  return (
    <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
      {/* Main Crate Body */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.2, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Crate Lid */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.6, 0.2, 1.6]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      
      {/* Metal Reinforcement Bands */}
      <mesh position={[0, 0, 0.76]}>
        <boxGeometry args={[1.55, 1.25, 0.05]} />
        <meshStandardMaterial color={bandColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.76]}>
        <boxGeometry args={[1.55, 1.25, 0.05]} />
        <meshStandardMaterial color={bandColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.76, 0, 0]}>
        <boxGeometry args={[0.05, 1.25, 1.55]} />
        <meshStandardMaterial color={bandColor} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.76, 0, 0]}>
        <boxGeometry args={[0.05, 1.25, 1.55]} />
        <meshStandardMaterial color={bandColor} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}