/**
 * Island.tsx
 * Procedurally generated low-poly island mesh.
 * Combines basic geometries (Cylinders, Cones) with vertex displacement 
 * to create unique landmasses without external GLTF models.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { IslandData } from '@/core/systems/WorldGeneration';

interface IslandProps {
  data: IslandData;
}

export function Island({ data }: IslandProps) {
  const { position, scale, seed } = data;

  // Generate island geometry once per island
  const { baseGeometry, peakGeometries } = useMemo(() => {
    // Simple seeded random for deterministic generation
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // Base beach/sand
    const baseGeo = new THREE.CylinderGeometry(8, 10, 2, 16, 1);
    // Displace base vertices slightly for organic shape
    const posAttr = baseGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 2) {
        posAttr.setX(i, x + (rand() - 0.5) * 2);
        posAttr.setZ(i, z + (rand() - 0.5) * 2);
      }
    }
    baseGeo.computeVertexNormals();

    // Mountain peaks / foliage
    const peaks: THREE.BufferGeometry[] = [];
    const numPeaks = 2 + Math.floor(rand() * 3);
    
    for (let i = 0; i < numPeaks; i++) {
      const peakRadius = 2 + rand() * 3;
      const peakHeight = 4 + rand() * 8;
      const peakGeo = new THREE.ConeGeometry(peakRadius, peakHeight, 8, 1);
      
      // Displace peak vertices
      const pAttr = peakGeo.attributes.position;
      for (let j = 0; j < pAttr.count; j++) {
        const y = pAttr.getY(j);
        if (y < peakHeight / 2 - 0.1) { // Don't displace the very top tip too much
          pAttr.setX(j, pAttr.getX(j) + (rand() - 0.5) * 1.5);
          pAttr.setZ(j, pAttr.getZ(j) + (rand() - 0.5) * 1.5);
        }
      }
      peakGeo.computeVertexNormals();
      
      // Translate to random position on the base
      const angle = rand() * Math.PI * 2;
      const dist = rand() * 4;
      peakGeo.translate(
        Math.cos(angle) * dist, 
        peakHeight / 2 + 0.5, // Sit on top of base
        Math.sin(angle) * dist
      );
      
      peaks.push(peakGeo);
    }

    return { baseGeometry: baseGeo, peakGeometries: peaks };
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      {/* Sand Base */}
      <mesh geometry={baseGeometry} castShadow receiveShadow position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#E3C182" roughness={0.9} flatShading />
      </mesh>
      
      {/* Vegetation / Rock Peaks */}
      {peakGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#4A7C59" : "#688E26"} // Green variations
            roughness={0.8} 
            flatShading 
          />
        </mesh>
      ))}
    </group>
  );
}