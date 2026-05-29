/**
 * OceanFlotsam.tsx
 * High-performance floating debris (barrels, planks) using InstancedMesh.
 * Spawns dynamically around the player to create a lived-in ocean feel.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';

const MAX_DEBRIS = 150;
const SPAWN_RADIUS = 120;

export function OceanFlotsam() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Store local offsets and phases for bobbing animation
  const debrisData = useMemo(() => {
    return Array.from({ length: MAX_DEBRIS }, () => ({
      offsetX: (Math.random() - 0.5) * SPAWN_RADIUS * 2,
      offsetZ: (Math.random() - 0.5) * SPAWN_RADIUS * 2,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.5,
      scale: 0.5 + Math.random() * 0.8,
      type: Math.random() > 0.5 ? 'barrel' : 'plank'
    }));
  }, []);

  // Initialize geometry and material
  const { geometry, material } = useMemo(() => {
    // Simple low-poly barrel/plank approximation
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 6);
    geo.rotateZ(Math.PI / 2); // Lay flat
    const mat = new THREE.MeshStandardMaterial({ color: '#5C3A21', roughness: 0.9, flatShading: true });
    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const shipPos = gameWorld.shipPhysics.position;

    for (let i = 0; i < MAX_DEBRIS; i++) {
      const d = debrisData[i];
      
      // World position relative to ship
      let wx = shipPos.x + d.offsetX;
      let wz = shipPos.z + d.offsetZ;

      // Recycle debris if it falls too far behind the ship
      const dx = wx - shipPos.x;
      const dz = wz - shipPos.z;
      if (dx * dx + dz * dz > SPAWN_RADIUS * SPAWN_RADIUS * 1.5) {
        d.offsetX = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
        d.offsetZ = (Math.random() - 0.5) * SPAWN_RADIUS * 2;
        wx = shipPos.x + d.offsetX;
        wz = shipPos.z + d.offsetZ;
      }

      const wy = getOceanHeight(wx, wz, time, 0.6) + 0.2;

      dummy.position.set(wx, wy, wz);
      dummy.rotation.set(
        Math.sin(time * 1.5 + d.phase) * 0.2, 
        time * d.rotSpeed, 
        Math.cos(time * 1.2 + d.phase) * 0.2
      );
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, MAX_DEBRIS]} castShadow receiveShadow frustumCulled={false} />
  );
}
