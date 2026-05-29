/**
 * FishingVFX.tsx
 * Renders the fishing rod line, bobber, and splash effects.
 * Uses @react-three/drei's Line component for stable rendering.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { fishingSystem } from '@/core/systems/FishingSystem';
import { gameWorld } from '@/core/engine/GameWorld';

export function FishingVFX() {
  const bobberRef = useRef<THREE.Mesh>(null);
  const splashRef = useRef<THREE.Mesh>(null);
  const linePointsRef = useRef<THREE.Vector3[]>([new THREE.Vector3(), new THREE.Vector3()]);

  useFrame(() => {
    const state = fishingSystem.state;
    const isVisible = state !== 'IDLE';

    if (bobberRef.current) bobberRef.current.visible = isVisible;
    if (splashRef.current) splashRef.current.visible = state === 'BITE';

    if (!isVisible) return;

    const shipPos = gameWorld.shipPhysics.position;
    const heading = gameWorld.shipPhysics.heading;
    
    // Rod tip position (approximate starboard rear)
    const rightX = Math.cos(heading);
    const rightZ = -Math.sin(heading);
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    
    const rodTipX = shipPos.x + rightX * 1.5 - fwdX * 2.0;
    const rodTipY = shipPos.y + 2.5;
    const rodTipZ = shipPos.z + rightZ * 1.5 - fwdZ * 2.0;

    // Update Line Points
    linePointsRef.current[0].set(rodTipX, rodTipY, rodTipZ);
    linePointsRef.current[1].set(fishingSystem.bobberX, fishingSystem.bobberY, fishingSystem.bobberZ);

    // Update Bobber
    if (bobberRef.current) {
      bobberRef.current.position.set(fishingSystem.bobberX, fishingSystem.bobberY, fishingSystem.bobberZ);
      if (state === 'BITE') {
        // Dipping animation
        bobberRef.current.position.y = fishingSystem.bobberY - 0.3 + Math.sin(performance.now() * 0.02) * 0.1;
      }
    }
    
    // Update Splash
    if (splashRef.current) {
      splashRef.current.position.set(fishingSystem.bobberX, 0.2, fishingSystem.bobberZ);
      splashRef.current.rotation.y += 0.1;
      splashRef.current.scale.setScalar(1 + Math.sin(performance.now() * 0.01) * 0.2);
    }
  });

  return (
    <group>
      <Line 
        points={linePointsRef.current} 
        color="#FFFFFF" 
        lineWidth={1} 
        transparent 
        opacity={0.6} 
      />
      
      <mesh ref={bobberRef} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#FF3333" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Splash ring when biting */}
      <mesh ref={splashRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.8, 16]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}