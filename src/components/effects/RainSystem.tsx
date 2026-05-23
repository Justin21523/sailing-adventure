/**
 * RainSystem.tsx
 * High-performance particle system for rain.
 * Only activates and renders when the weather condition dictates precipitation.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWeatherStore } from '@/stores/weatherStore';

const MAX_DROPS = 3000;
const BOUNDS = 80; // Radius around the camera/ship to render rain

export function RainSystem() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities, geometry } = useMemo(() => {
    const positions = new Float32Array(MAX_DROPS * 3);
    const velocities = new Float32Array(MAX_DROPS);
    
    for (let i = 0; i < MAX_DROPS; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS * 2;
      positions[i * 3 + 1] = Math.random() * 50 + 10; // Start high up
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS * 2;
      
      velocities[i] = 20 + Math.random() * 15; // Fall speed
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    return { positions, velocities, geometry };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const { condition } = useWeatherStore.getState();
    const isRaining = condition === 'RAIN' || condition === 'STORM';
    
    // Toggle visibility based on weather
    pointsRef.current.visible = isRaining;
    if (!isRaining) return;

    const shipPos = state.camera.position; // Center rain around camera/ship
    
    for (let i = 0; i < MAX_DROPS; i++) {
      const i3 = i * 3;
      
      // Move down
      positions[i3 + 1] -= velocities[i] * delta;
      
      // Add slight wind drift
      positions[i3] += delta * 2; 

      // Reset if below ocean surface or too far away
      if (positions[i3 + 1] < 0 || 
          Math.abs(positions[i3] - shipPos.x) > BOUNDS || 
          Math.abs(positions[i3 + 2] - shipPos.z) > BOUNDS) {
        
        // Respawn above the camera area
        positions[i3] = shipPos.x + (Math.random() - 0.5) * BOUNDS * 2;
        positions[i3 + 1] = shipPos.y + 30 + Math.random() * 20;
        positions[i3 + 2] = shipPos.z + (Math.random() - 0.5) * BOUNDS * 2;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color="#AACCFF"
        size={0.15}
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}