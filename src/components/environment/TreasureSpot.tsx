/**
 * TreasureSpot.tsx
 * Renders a glowing 3D marker and light beam at the exact coordinates of active treasure maps.
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { treasureMapSystem, type TreasureMap } from '@/core/systems/TreasureMapSystem';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';

function TreasureMarker({ map }: { map: TreasureMap }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const y = getOceanHeight(map.targetX, map.targetZ, t, 0.6);
    
    groupRef.current.position.set(map.targetX, y + 2 + Math.sin(t * 2) * 0.5, map.targetZ);
    groupRef.current.rotation.y = t;
    
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(t * 4) * 1;
    }
  });

  const color = map.rarity === 'EPIC' ? '#A855F7' : map.rarity === 'RARE' ? '#3B82F6' : '#F59E0B';

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} flatShading />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={3} distance={20} />
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[0.1, 0.5, 10, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function TreasureSpotRenderer() {
  const [maps, setMaps] = useState<TreasureMap[]>([]);
  const lastCount = useRef(0);

  useFrame(() => {
    if (treasureMapSystem.maps.length !== lastCount.current) {
      lastCount.current = treasureMapSystem.maps.length;
      setMaps([...treasureMapSystem.maps]);
    }
  });

  return (
    <>
      {maps.map(m => <TreasureMarker key={m.id} map={m} />)}
    </>
  );
}